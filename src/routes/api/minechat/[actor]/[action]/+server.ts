import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { and, eq, gt, lte } from 'drizzle-orm';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { db } from '$db';
import { minechatCredentials, minechatHooks, minechatPairings, minechatUsers } from '$db/schema';
import { createConnection } from 'node:net';

export const hashSecret = (secret: string) => createHash('sha256').update(secret).digest('hex');

export function matchesSecret(value: string | null, expected: string | undefined): boolean {
	return (
		!!value &&
		!!expected &&
		timingSafeEqual(Buffer.from(hashSecret(value)), Buffer.from(hashSecret(expected)))
	);
}

export function minecraftPacket(message: string): Buffer {
	const content = Buffer.from(message, 'utf8');
	const packet = Buffer.alloc(4 + content.length);
	packet.writeUInt32LE(content.length, 0);
	content.copy(packet, 4);
	return packet;
}

export function sendMinecraft(host: string, message: string, port = 7051): Promise<void> {
	return new Promise((resolve, reject) => {
		const socket = createConnection({ host, port });
		socket.setTimeout(5_000, () => socket.destroy(new Error('Minecraft connection timed out')));
		socket.once('error', reject);
		socket.once('connect', () => socket.end(minecraftPacket(message)));
		socket.once('finish', () => {
			socket.destroy();
			resolve();
		});
	});
}

export function cleanMinecraft(message: string): string {
	return message.replace(/[§&][0-9a-fk-orx]/gi, '').replace(/[\u0000-\u001f\u007f]/g, '');
}

export function minecraftMessage(prefix: string, name: string, message: string): string {
	// Only administrators may supply formatting codes in the prefix.
	return prefix.replaceAll('%1', name) + cleanMinecraft(message);
}

export const POST: RequestHandler = ({ request, params }) =>
handleMinechat(request, params.actor!, params.action!, process.env.MINECHAT_BOT_SECRET);

const id = z.string().regex(/^\d{17,20}$/);
const uuid = z
.string()
.regex(/^(?:[0-9a-f]{32}|[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})$/i)
.transform((value) =>
value
.replaceAll('-', '')
.toLowerCase()
.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5')
);
const name = z.string().regex(/^[A-Za-z0-9_]{1,16}$/);
const token = z.string().min(1).max(256);
const webhookToken = z.string().regex(/^[A-Za-z0-9._-]{1,256}$/);
const message = z
.string()
.min(1)
.max(2000)
.refine((value) => value.trim().length > 0);
const serverId = z.string().min(1).max(128);
const botSchemas = {
	list: z.object({}),
	msg: z.object({ channel: id, user: id, msg: message }),
	link: z.object({ channel: id, id, token: webhookToken, key: token }),
	quit: z.object({ channel: id }),
	token: z.object({ user: id, token }),
	prefix: z.object({
		channel: id,
		prefix: z
		.string()
		.min(1)
		.max(100)
		.refine((value) => !/[\u0000-\u001f\u007f]/.test(value))
	})
};
const serverSchemas = {
	start: z.object({ serverId, version: z.string().max(64).optional() }),
	list: z.object({ serverId }),
	link: z.object({ serverId }),
	quit: z.object({ serverId, channel: id }),
	token: z.object({ serverId, uuid, name }),
	msg: z.object({ serverId, uuid, msg: message }),
	join: z.object({ serverId, uuid, name: name.optional() }),
	leave: z.object({ serverId, uuid, name: name.optional() })
};

export class MinechatError extends Error {
	constructor(
		public status: number,
			public code: string,
				message: string
	) {
		super(message);
	}
}
function fail(status: number, code: string, message: string): never {
	throw new MinechatError(status, code, message);
}
const success = (data: Record<string, unknown> = {}) =>
json({ ok: true, ...data }, { headers: { 'Cache-Control': 'no-store' } });

async function issuePairing(
	kind: 'server' | 'user',
	subject: string,
	source: string,
	minecraftName?: string
) {
	const secret = randomBytes(18).toString('base64url');
	const expires = new Date(Date.now() + 10 * 60_000);
	await db.delete(minechatPairings).where(lte(minechatPairings.expires, new Date()));
	await db
	.insert(minechatPairings)
	.values({
		tokenHash: hashSecret(secret),
			kind,
			subject,
			serverId: source,
			minecraftName,
			expires
	})
	.onConflictDoUpdate({
		target: [minechatPairings.kind, minechatPairings.subject],
		set: {
			tokenHash: hashSecret(secret),
						serverId: source,
						minecraftName: minecraftName ?? null,
						expires
		}
	});
	return { token: secret, expires: expires.toISOString() };
}

async function consumePairing(
	tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
	secret: string,
	kind: 'server' | 'user'
) {
	const [pairing] = await tx
	.delete(minechatPairings)
	.where(
		and(
			eq(minechatPairings.tokenHash, hashSecret(secret)),
			eq(minechatPairings.kind, kind),
			gt(minechatPairings.expires, new Date())
		)
	)
	.returning();
	return pairing ?? fail(400, 'INVALID_TOKEN', 'The pairing token is invalid or expired.');
}

type Hook = typeof minechatHooks.$inferSelect;
async function sendWebhook(
	hook: Hook,
	content: string,
	player?: { minecraftUuid: string; minecraftName: string },
	mentions: string[] = []
) {
	try {
		const response = await fetch(
			`https://discord.com/api/webhooks/${hook.webhookId}/${hook.token}`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					content,
					username: player?.minecraftName,
					avatar_url: player ? `https://crafatar.com/avatars/${player.minecraftUuid}` : undefined,
					allowed_mentions: { parse: [], users: [...new Set(mentions)].slice(0, 100) }
				}),
				signal: AbortSignal.timeout(10_000)
			}
		);
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
	} catch {
		fail(502, 'DISCORD_UNAVAILABLE', 'Discord could not receive the message.');
	}
}

async function botAction(action: string, input: unknown): Promise<Response> {
	switch (action) {
		case 'list':
			return success({
				channels: (await db.query.minechatHooks.findMany({ columns: { channelId: true } })).map(
					(hook) => hook.channelId
				)
			});
		case 'link': {
			const data = botSchemas.link.parse(input);
			await db.transaction(async (tx) => {
				const pairing = await consumePairing(tx, data.key, 'server');
				await tx.insert(minechatHooks).values({
					webhookId: data.id,
					channelId: data.channel,
					token: data.token,
					minecraftServerId: pairing.subject
				});
			});
			return success();
		}
		case 'quit': {
			const data = botSchemas.quit.parse(input);
			const [hook] = await db
			.delete(minechatHooks)
			.where(eq(minechatHooks.channelId, data.channel))
			.returning();
			return success({ webhook: hook ? { id: hook.webhookId, token: hook.token } : null });
		}
		case 'token': {
			const data = botSchemas.token.parse(input);
			const player = await db.transaction(async (tx) => {
				const pairing = await consumePairing(tx, data.token, 'user');
				const [player] = await tx
				.insert(minechatUsers)
				.values({
					minecraftUuid: pairing.subject,
					minecraftName: pairing.minecraftName!,
					discordUserId: data.user
				})
				.returning();
				return player;
			});
			return success({ minecraftName: player.minecraftName });
		}
		case 'prefix': {
			const data = botSchemas.prefix.parse(input);
			const [hook] = await db
			.update(minechatHooks)
			.set({ prefix: data.prefix })
			.where(eq(minechatHooks.channelId, data.channel))
			.returning();
			if (!hook) fail(404, 'NOT_LINKED', 'This channel is not linked.');
			return success();
		}
		case 'msg': {
			const data = botSchemas.msg.parse(input);
			const hook = await db.query.minechatHooks.findFirst({
				where: { channelId: data.channel },
				with: { server: true }
			});
			if (!hook?.server) fail(404, 'NOT_LINKED', 'This channel is not linked.');
			const player = await db.query.minechatUsers.findFirst({
				where: { discordUserId: data.user }
			});
			if (!player)
				fail(403, 'ACCOUNT_NOT_LINKED', 'Link your Minecraft account using /token first.');
			const ids = [...data.msg.matchAll(/<@!?(\d+)>/g)].map((match) => match[1]);
			const users = ids.length
			? await db.query.minechatUsers.findMany({ where: { discordUserId: { in: ids } } })
			: [];
			const names = new Map(users.map((user) => [user.discordUserId, user.minecraftName]));
			const content = data.msg.replace(
				/<@!?(\d+)>/g,
											 (_, id: string) => `@${names.get(id) ?? 'Unknown'}`
			);
			try {
				await sendMinecraft(
					hook.server.ip,
					minecraftMessage(hook.prefix, player.minecraftName, content)
				);
			} catch {
				fail(502, 'MINECRAFT_UNAVAILABLE', 'Minecraft could not receive the message.');
			}
			return success();
		}
	}
	return fail(404, 'UNKNOWN_ACTION', 'Unknown Minechat endpoint.');
}

async function serverAction(action: string, input: unknown): Promise<Response> {
	const base = z.object({ serverId }).parse(input);
	switch (action) {
		case 'start':
			return success({ protocol: 1, tcpPort: 7051 });
		case 'list':
			return success({
				channels: await db.query.minechatHooks.findMany({
					where: { minecraftServerId: base.serverId },
					columns: { channelId: true, prefix: true }
				})
			});
		case 'link': {
			if (await db.query.minechatHooks.findFirst({ where: { minecraftServerId: base.serverId } }))
				fail(409, 'ALREADY_LINKED', 'This server is already linked.');
				return success(await issuePairing('server', base.serverId, base.serverId));
		}
		case 'quit': {
			const data = serverSchemas.quit.parse(input);
			const [hook] = await db
			.delete(minechatHooks)
			.where(
				and(
					eq(minechatHooks.minecraftServerId, data.serverId),
					eq(minechatHooks.channelId, data.channel)
				)
			)
			.returning();
			if (!hook) fail(404, 'NOT_LINKED', 'This channel is not linked to this server.');
			await sendWebhook(hook, 'The Minecraft server disconnected this channel.').catch(() => {});
			// Delete the owned webhook, without blocking unlink if Discord already removed it.
			await fetch(`https://discord.com/api/webhooks/${hook.webhookId}/${hook.token}`, {
				method: 'DELETE',
				signal: AbortSignal.timeout(10_000)
			}).catch(() => {});
			return success();
		}
		case 'token': {
			const data = serverSchemas.token.parse(input);
			if (await db.query.minechatUsers.findFirst({ where: { minecraftUuid: data.uuid } }))
				fail(409, 'ALREADY_LINKED', 'This Minecraft account is already linked.');
				return success(await issuePairing('user', data.uuid, data.serverId, data.name));
		}
		case 'msg':
		case 'join':
		case 'leave': {
			const data = (action === 'msg' ? serverSchemas.msg : serverSchemas.join).parse(input);
			const player = await db.query.minechatUsers.findFirst({
				where: { minecraftUuid: data.uuid }
			});
			if (!player) fail(403, 'ACCOUNT_NOT_LINKED', 'This Minecraft account is not linked.');
			if ('name' in data && data.name && player.minecraftName !== data.name) {
				await db
				.update(minechatUsers)
				.set({ minecraftName: data.name })
				.where(eq(minechatUsers.minecraftUuid, data.uuid));
				player.minecraftName = data.name;
			}
			const hooks = await db.query.minechatHooks.findMany({
				where: { minecraftServerId: data.serverId }
			});
			if (!hooks.length) fail(404, 'NOT_LINKED', 'This server is not linked to a Discord channel.');
			let content = `**${player.minecraftName} ${action === 'join' ? 'joined' : 'left'} the game**`;
			const mentions: string[] = [];
			if ('msg' in data) {
				content = cleanMinecraft(data.msg);
				if (!content.trim())
					fail(400, 'INVALID_REQUEST', 'Message is empty after removing formatting.');
				const names = [...content.matchAll(/@([A-Za-z0-9_]{1,16})\b/g)].map((match) => match[1]);
				const users = names.length
				? await db.query.minechatUsers.findMany({ where: { minecraftName: { in: names } } })
				: [];
				const ids = new Map(users.map((user) => [user.minecraftName, user.discordUserId]));
				content = content.replace(/@([A-Za-z0-9_]{1,16})\b/g, (match, name: string) => {
					const id = ids.get(name);
					if (!id) return match;
					mentions.push(id);
					return `<@${id}>`;
				});
				if (content.length > 2000)
					fail(
						400,
		  'INVALID_REQUEST',
		  'Message exceeds the Discord length limit after resolving mentions.'
					);
			}
			await Promise.all(
				hooks.map((hook) =>
				sendWebhook(hook, content, action === 'msg' ? player : undefined, mentions)
				)
			);
			return success();
		}
	}
	return fail(404, 'UNKNOWN_ACTION', 'Unknown Minechat endpoint.');
}

export async function handleMinechat(
	request: Request,
	actor: string,
	action: string,
	botSecret: string | undefined
) {
	try {
		const schemas = actor === 'bot' ? botSchemas : actor === 'server' ? serverSchemas : null;
		if (!schemas || !Object.hasOwn(schemas, action))
			fail(404, 'UNKNOWN_ACTION', 'Unknown Minechat endpoint.');
		if (actor === 'bot' && !matchesSecret(request.headers.get('x-minechat-bot-secret'), botSecret))
			fail(401, 'UNAUTHORIZED', 'Invalid bot credentials.');
		if (Number(request.headers.get('content-length')) > 16_384)
			fail(413, 'INVALID_REQUEST', 'Request is too large.');
		const body = await request.text();
		if (Buffer.byteLength(body) > 16_384) fail(413, 'INVALID_REQUEST', 'Request is too large.');
		let input: unknown;
		try {
			input = JSON.parse(body);
		} catch {
			fail(400, 'INVALID_REQUEST', 'Expected a JSON body.');
		}
		const schema = (schemas as Record<string, z.ZodType>)[action];
		const data = schema.parse(input);
		if (actor === 'server') {
			const { serverId: id } = z.object({ serverId }).parse(data);
			const credential = await db.query.minechatCredentials.findFirst({ where: { serverId: id } });
			const key = request.headers.get('x-minechat-server-key');
			if (!key || !credential || !matchesSecret(hashSecret(key), credential.secretHash))
				fail(401, 'UNAUTHORIZED', 'Invalid server credentials.');
			return await serverAction(action, data);
		}
		return await botAction(action, data);
	} catch (error) {
		if (error instanceof z.ZodError)
			return json(
				{ ok: false, error: { code: 'INVALID_REQUEST', message: 'Invalid request fields.' } },
			   { status: 400 }
			);
		if (error instanceof MinechatError)
			return json(
				{ ok: false, error: { code: error.code, message: error.message } },
			   { status: error.status }
			);
		let cause: unknown = error;
		while (cause && typeof cause === 'object') {
			if (
				('code' in cause && cause.code === '23505') ||
				('errno' in cause && cause.errno === '23505')
			)
				return json(
					{
						ok: false,
						error: {
							code: 'ALREADY_LINKED',
							message: 'This account, server, or channel is already linked.'
						}
					},
				{ status: 409 }
				);
				cause = 'cause' in cause ? cause.cause : null;
		}
		// Do not log database parameters, request bodies, pairing tokens or webhook secrets.
		console.error('Minechat request failed', { actor, action });
		return json(
			{ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Minechat request failed.' } },
			{ status: 500 }
		);
	}
}
