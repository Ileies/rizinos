import { afterAll, beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test';
import { SQL } from 'bun';
import { createServer } from 'node:net';
import { drizzle } from 'drizzle-orm/bun-sql';
import { defineRelations } from 'drizzle-orm';
import * as schema from '../src/lib/server/db/schemaMinechat';
import {
	cleanMinecraft,
	hashSecret,
	matchesSecret,
	minecraftMessage,
	minecraftPacket,
	sendMinecraft
} from '../src/lib/server/minechat/protocol';

const databaseUrl = process.env.MINECHAT_TEST_DATABASE_URL;
const integration = databaseUrl ? describe : describe.skip;

test('secrets fail closed and compare safely', () => {
	expect(matchesSecret(null, undefined)).toBe(false);
	expect(matchesSecret('', '')).toBe(false);
	expect(matchesSecret('short', 'longer')).toBe(false);
	expect(matchesSecret('correct', 'correct')).toBe(true);
});

test('UTF-8 frames use byte length and preserve Minecraft formatting and Unicode', () => {
	const content = '§a<Steve> Grüße 世界 🐈';
	const packet = minecraftPacket(content);
	expect(packet.readUInt32LE(0)).toBe(Buffer.byteLength(content));
	expect(packet.subarray(4).toString('utf8')).toBe(content);
	expect(cleanMinecraft('§aHello &lworld\n!')).toBe('Hello world!');
	expect(minecraftMessage('§a<%1> ', 'Steve', 'hello§4\n!')).toBe('§a<Steve> hello!');
});

test('TCP delivery sends a framed packet and rejects refused connections', async () => {
	let receive!: (data: Buffer) => void;
	const received = new Promise<Buffer>((resolve) => {
		receive = resolve;
	});
	const server = createServer((socket) => {
		const chunks: Buffer[] = [];
		socket.on('data', (chunk) => chunks.push(chunk));
		socket.on('end', () => {
			receive(Buffer.concat(chunks));
			socket.end();
		});
	});
	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
	const port = (server.address() as { port: number }).port;
	try {
		await sendMinecraft('127.0.0.1', 'Grüße', port);
		expect(await received).toEqual(minecraftPacket('Grüße'));
	} finally {
		await new Promise<void>((resolve) => server.close(() => resolve()));
	}
	await expect(sendMinecraft('127.0.0.1', 'offline', port)).rejects.toBeDefined();
});

integration('Minechat API with isolated PostgreSQL tables', () => {
	const namespace = `minechat_test_${process.pid}_${Date.now()}`;
	let admin: SQL;
	let sql: SQL;
	let db: ReturnType<
		typeof drizzle<typeof schema, ReturnType<typeof defineRelations<typeof schema>>>
	>;
	let handle: typeof import('../src/lib/server/minechat/api').handleMinechat;
	const botSecret = 'integration-bot-secret';
	const serverKey = 'integration-server-key';
	const channel = '123456789012345678';
	const discordUser = '223456789012345678';
	const uuid = '12345678-1234-1234-1234-123456789012';
	const originalFetch = globalThis.fetch;
	let webhooks: { url: string; body: Record<string, unknown> }[] = [];
	let discordStatus = 204;

	async function call(
		actor: string,
		action: string,
		body: unknown = {},
		key = actor === 'bot' ? botSecret : serverKey
	) {
		const response = await handle(
			new Request('http://localhost/api/minechat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					[actor === 'bot' ? 'x-minechat-bot-secret' : 'x-minechat-server-key']: key
				},
				body: JSON.stringify(body)
			}),
			actor,
			action,
			botSecret
		);
		return { status: response.status, body: (await response.json()) as any };
	}
	async function pairServer(source = 'one', channelId = channel) {
		const pairing = await call('server', 'link', { serverId: source });
		expect(pairing.status).toBe(200);
		const link = await call('bot', 'link', {
			channel: channelId,
			id: channelId,
			token: `webhook-${channelId}`,
			key: pairing.body.token
		});
		expect(link.status).toBe(200);
		return pairing.body.token as string;
	}
	async function pairPlayer(playerUuid = uuid, user = discordUser, name = 'Steve') {
		const pairing = await call('server', 'token', { serverId: 'one', uuid: playerUuid, name });
		expect(pairing.status).toBe(200);
		const result = await call('bot', 'token', { user, token: pairing.body.token });
		expect(result.status).toBe(200);
		return pairing.body.token as string;
	}
	beforeAll(async () => {
		admin = new SQL(databaseUrl!);
		await admin.unsafe(`CREATE SCHEMA "${namespace}"`);
		sql = new SQL({ url: databaseUrl!, connection: { search_path: namespace } });
		await sql.unsafe(`CREATE TABLE minechat_servers (server_id text NOT NULL UNIQUE, ip text NOT NULL UNIQUE);
			CREATE TABLE minechat_users (mc_uuid text NOT NULL UNIQUE, dc_user_id text NOT NULL UNIQUE, mc_name text NOT NULL UNIQUE, token text UNIQUE);
			CREATE TABLE minechat_hooks (webhook text NOT NULL UNIQUE, channel text NOT NULL UNIQUE, token text NOT NULL UNIQUE,
			mc_server_id text NOT NULL UNIQUE REFERENCES minechat_servers(server_id) ON DELETE CASCADE, prefix text NOT NULL DEFAULT '<%1> ');`);
		await sql.unsafe(
			await Bun.file(new URL('../scripts/sql/minechat.sql', import.meta.url)).text()
		);
		const relations = defineRelations(schema, (r) => ({
			minechatHooks: {
				server: r.one.minechatServers({
					from: r.minechatHooks.minecraftServerId,
					to: r.minechatServers.serverId
				})
			}
		}));
		db = drizzle({ client: sql, schema, relations });
		mock.module('../src/lib/server/db/index.ts', () => ({ db }));
		handle = (await import('../src/lib/server/minechat/api')).handleMinechat;
		globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
			webhooks.push({ url: String(input), body: init?.body ? JSON.parse(String(init.body)) : {} });
			return new Response(null, { status: discordStatus });
		}) as typeof fetch;
	});
	beforeEach(async () => {
		await sql.unsafe('TRUNCATE minechat_servers, minechat_users CASCADE');
		await db.insert(schema.minechatServers).values([
			{ serverId: 'one', ip: '127.0.0.1' },
			{ serverId: 'two', ip: '127.0.0.2' }
		]);
		await db
			.insert(schema.minechatCredentials)
			.values(['one', 'two'].map((serverId) => ({ serverId, secretHash: hashSecret(serverKey) })));
		webhooks = [];
		discordStatus = 204;
	});
	afterAll(async () => {
		globalThis.fetch = originalFetch;
		await sql?.close();
		if (admin) {
			await admin.unsafe(`DROP SCHEMA IF EXISTS "${namespace}" CASCADE`);
			await admin.close();
		}
		mock.restore();
	});
	test('authentication, action validation and request validation', async () => {
		expect((await call('bot', 'list', {}, '')).status).toBe(401);
		expect((await call('server', 'start', { serverId: 'one' }, 'wrong')).status).toBe(401);
		expect((await call('server', 'start', { serverId: 'missing' })).status).toBe(401);
		expect((await call('server', 'start', { serverId: 'one' })).body.protocol).toBe(1);
		expect((await call('bot', 'nope')).status).toBe(404);
		expect((await call('other', 'list')).status).toBe(404);
		expect((await call('bot', 'prefix', { channel: 'invalid', prefix: 'ok' })).status).toBe(400);
		expect((await call('bot', 'prefix', { channel, prefix: '\n' })).status).toBe(400);
	});
	test('server pairing is single use, expires and rolls back on channel conflicts', async () => {
		const used = await pairServer();
		expect(
			(await call('bot', 'link', { channel, id: channel, token: 'a', key: used })).body.error.code
		).toBe('INVALID_TOKEN');
		expect((await call('server', 'link', { serverId: 'one' })).status).toBe(409);
		const pairing = await call('server', 'link', { serverId: 'two' });
		expect(
			(
				await call('bot', 'link', {
					channel,
					id: channel,
					token: 'another',
					key: pairing.body.token
				})
			).status
		).toBe(409);
		expect(await db.query.minechatPairings.findFirst({ where: { subject: 'two' } })).toBeDefined();
		await db.update(schema.minechatPairings).set({ expires: new Date(0) });
		expect(
			(
				await call('bot', 'link', {
					channel: '323456789012345678',
					id: '323456789012345678',
					token: 'a',
					key: pairing.body.token
				})
			).status
		).toBe(400);
	});
	test('pairing consumption is atomic under concurrent requests', async () => {
		const pairing = await call('server', 'link', { serverId: 'one' });
		const responses = await Promise.all(
			[channel, '323456789012345678'].map((id) =>
				call('bot', 'link', { channel: id, id, token: id, key: pairing.body.token })
			)
		);
		expect(responses.map((r) => r.status).sort()).toEqual([200, 400]);
		expect(await db.query.minechatHooks.findMany()).toHaveLength(1);
	});
	test('user linking affects only its UUID and does not permit replay or reassignment', async () => {
		const used = await pairPlayer();
		await pairPlayer('22345678-1234-1234-1234-123456789012', '323456789012345678', 'Alex');
		expect(await db.query.minechatUsers.findMany()).toHaveLength(2);
		expect((await call('bot', 'token', { user: '423456789012345678', token: used })).status).toBe(
			400
		);
		expect((await call('server', 'token', { serverId: 'one', uuid, name: 'Steve' })).status).toBe(
			409
		);
		expect(
			(await db.query.minechatUsers.findFirst({ where: { minecraftUuid: uuid } }))?.discordUserId
		).toBe(discordUser);
	});
	test('prefix updates and unlinks are scoped to their channel and server', async () => {
		await pairServer();
		await pairServer('two', '323456789012345678');
		expect((await call('bot', 'prefix', { channel, prefix: '§a%1: ' })).status).toBe(200);
		expect(
			(await db.query.minechatHooks.findFirst({ where: { minecraftServerId: 'two' } }))?.prefix
		).toBe('<%1> ');
		expect((await call('server', 'quit', { serverId: 'two', channel })).status).toBe(404);
		expect((await call('server', 'list', { serverId: 'one' })).body.channels).toHaveLength(1);
		expect((await call('bot', 'list')).body.channels).toHaveLength(2);
		expect((await call('bot', 'quit', { channel })).body.webhook.id).toBe(channel);
		expect((await call('bot', 'list')).body.channels).toHaveLength(1);
		expect(
			(await call('server', 'quit', { serverId: 'two', channel: '323456789012345678' })).status
		).toBe(200);
		expect((await call('bot', 'list')).body.channels).toEqual([]);
	});
	test('Minecraft can unlink a stale webhook while Discord is unavailable', async () => {
		await pairServer();
		discordStatus = 404;
		expect((await call('server', 'quit', { serverId: 'one', channel })).status).toBe(200);
		expect((await call('bot', 'list')).body.channels).toEqual([]);
	});
	test('renewing player tokens invalidates old tokens and preserves links on conflicts', async () => {
		const first = await call('server', 'token', { serverId: 'one', uuid, name: 'Steve' });
		const second = await call('server', 'token', { serverId: 'one', uuid, name: 'Steve' });
		expect(
			(await call('bot', 'token', { user: discordUser, token: first.body.token })).status
		).toBe(400);
		const stored = await db.query.minechatPairings.findFirst({ where: { subject: uuid } });
		expect(stored?.tokenHash).toBe(hashSecret(second.body.token));
		expect(stored?.tokenHash).not.toBe(second.body.token);
		expect(
			(await call('bot', 'token', { user: discordUser, token: second.body.token })).status
		).toBe(200);
		const other = await call('server', 'token', {
			serverId: 'one',
			uuid: '22345678-1234-1234-1234-123456789012',
			name: 'Alex'
		});
		expect(
			(await call('bot', 'token', { user: discordUser, token: other.body.token })).status
		).toBe(409);
		expect(
			(await db.query.minechatUsers.findFirst({ where: { minecraftUuid: uuid } }))?.minecraftName
		).toBe('Steve');
		expect(
			(await call('bot', 'token', { user: '323456789012345678', token: other.body.token })).status
		).toBe(200);
	});
	test('Minecraft chat resolves mentions, blocks mass mentions and reports Discord failures', async () => {
		await pairServer();
		await pairPlayer();
		await pairPlayer('22345678-1234-1234-1234-123456789012', '323456789012345678', 'Alex');
		expect(
			(
				await call('server', 'msg', {
					serverId: 'one',
					uuid,
					msg: '§aHello @Alex @everyone <@423456789012345678>'
				})
			).status
		).toBe(200);
		expect(webhooks[0].body.content).toBe(
			'Hello <@323456789012345678> @everyone <@423456789012345678>'
		);
		expect(webhooks[0].body.allowed_mentions).toEqual({ parse: [], users: ['323456789012345678'] });
		expect(webhooks[0].body.username).toBe('Steve');
		discordStatus = 429;
		expect((await call('server', 'msg', { serverId: 'one', uuid, msg: 'hello' })).status).toBe(502);
	});
	test('join and leave announcements and player renames', async () => {
		await pairServer();
		await pairPlayer();
		expect((await call('server', 'join', { serverId: 'one', uuid, name: 'NewName' })).status).toBe(
			200
		);
		expect(webhooks[0].body.content).toBe('**NewName joined the game**');
		expect((await call('server', 'leave', { serverId: 'one', uuid })).status).toBe(200);
		expect(webhooks[1].body.content).toBe('**NewName left the game**');
	});
	test('Discord relay requires linked accounts and reports offline Minecraft', async () => {
		await pairServer();
		expect((await call('bot', 'msg', { channel, user: discordUser, msg: 'hello' })).status).toBe(
			403
		);
		await pairPlayer();
		expect(
			(await call('bot', 'msg', { channel, user: discordUser, msg: 'hello' })).body.error.code
		).toBe('MINECRAFT_UNAVAILABLE');
	});
	test('Discord relay resolves mentions and applies the stored prefix over TCP', async () => {
		await pairServer();
		await pairPlayer();
		let receive!: (data: Buffer) => void;
		const received = new Promise<Buffer>((resolve) => {
			receive = resolve;
		});
		const tcp = createServer((socket) => {
			const chunks: Buffer[] = [];
			socket.on('data', (chunk) => chunks.push(chunk));
			socket.on('end', () => {
				receive(Buffer.concat(chunks));
				socket.end();
			});
		});
		await new Promise<void>((resolve) => tcp.listen(7051, '127.0.0.1', resolve));
		try {
			expect(
				(await call('bot', 'msg', { channel, user: discordUser, msg: `Grüße <@${discordUser}>` }))
					.status
			).toBe(200);
			expect((await received).subarray(4).toString('utf8')).toBe('<Steve> Grüße @Steve');
		} finally {
			await new Promise<void>((resolve) => tcp.close(() => resolve()));
		}
	});
});
