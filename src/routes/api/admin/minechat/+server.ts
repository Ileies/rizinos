import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$db';
import { minechatUsers, minechatHooks, minechatServers } from '$db/schema';
import { eq } from 'drizzle-orm';
import { Role } from '$types';
import { hasRole } from '$lib/server/models/User';

function isAdmin(locals: App.Locals) {
	return !!locals.user && hasRole(locals.user, Role.Admin);
}

const forbidden = () => json({ message: 'Forbidden' }, { status: 403 });

export const GET: RequestHandler = async ({ locals }) => {
	if (!isAdmin(locals)) return forbidden();

	const [users, hooks, servers] = await Promise.all([
		db.query.minechatUsers.findMany(),
		db.query.minechatHooks.findMany({ with: { server: true } }),
		db.query.minechatServers.findMany({ with: { hook: true } })
	]);

	return json({ users, hooks, servers });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!isAdmin(locals)) return forbidden();

	const { action, ...data } = (await request.json()) as Record<string, string> & { action: string };

	switch (action) {
		case 'userCreate': {
			const minecraftUuid = data.minecraftUuid?.trim();
			const discordUserId = data.discordUserId?.trim();
			const minecraftName = data.minecraftName?.trim();
			const token = data.token?.trim() || null;

			if (!minecraftUuid || !discordUserId || !minecraftName)
				return json({ message: 'UUID, Discord ID, and MC name required' }, { status: 400 });

			try {
				await db
					.insert(minechatUsers)
					.values({ minecraftUuid, discordUserId, minecraftName, token });
				return json({ success: true });
			} catch {
				return json({ message: 'Duplicate UUID, Discord ID, or MC name' }, { status: 400 });
			}
		}

		case 'userUpdate': {
			const minecraftUuid = data.minecraftUuid?.trim();
			const discordUserId = data.discordUserId?.trim();
			const minecraftName = data.minecraftName?.trim();
			const token = data.token?.trim() || null;

			if (!minecraftUuid || !discordUserId || !minecraftName)
				return json({ message: 'Required fields missing' }, { status: 400 });

			try {
				await db
					.update(minechatUsers)
					.set({ discordUserId, minecraftName, token })
					.where(eq(minechatUsers.minecraftUuid, minecraftUuid));
				return json({ success: true });
			} catch {
				return json({ message: 'Duplicate Discord ID or MC name' }, { status: 400 });
			}
		}

		case 'userDelete': {
			const minecraftUuid = data.minecraftUuid?.trim();
			if (!minecraftUuid) return json({ message: 'UUID required' }, { status: 400 });

			await db.delete(minechatUsers).where(eq(minechatUsers.minecraftUuid, minecraftUuid));
			return json({ success: true });
		}

		case 'hookCreate': {
			const webhookId = data.webhookId?.trim();
			const channelId = data.channelId?.trim();
			const token = data.token?.trim();
			const minecraftServerId = data.minecraftServerId?.trim();
			const prefix = data.prefix?.trim() || '<%1> ';

			if (!webhookId || !channelId || !token || !minecraftServerId)
				return json({ message: 'All hook fields required' }, { status: 400 });

			try {
				await db
					.insert(minechatHooks)
					.values({ webhookId, channelId, token, minecraftServerId, prefix });
				return json({ success: true });
			} catch {
				return json({ message: 'Duplicate webhook or server already linked' }, { status: 400 });
			}
		}

		case 'hookUpdate': {
			const webhookId = data.webhookId?.trim();
			const channelId = data.channelId?.trim();
			const token = data.token?.trim();
			const minecraftServerId = data.minecraftServerId?.trim();
			const prefix = data.prefix?.trim() || '<%1> ';

			if (!webhookId || !channelId || !token || !minecraftServerId)
				return json({ message: 'Required fields missing' }, { status: 400 });

			try {
				await db
					.update(minechatHooks)
					.set({ channelId, token, minecraftServerId, prefix })
					.where(eq(minechatHooks.webhookId, webhookId));
				return json({ success: true });
			} catch {
				return json({ message: 'Duplicate channel or server conflict' }, { status: 400 });
			}
		}

		case 'hookDelete': {
			const webhookId = data.webhookId?.trim();
			if (!webhookId) return json({ message: 'Webhook ID required' }, { status: 400 });

			await db.delete(minechatHooks).where(eq(minechatHooks.webhookId, webhookId));
			return json({ success: true });
		}

		case 'serverCreate': {
			const serverId = data.serverId?.trim();
			const ip = data.ip?.trim();

			if (!serverId || !ip) return json({ message: 'Server ID and IP required' }, { status: 400 });

			try {
				await db.insert(minechatServers).values({ serverId, ip });
				return json({ success: true });
			} catch {
				return json({ message: 'Duplicate server ID or IP' }, { status: 400 });
			}
		}

		case 'serverUpdate': {
			const serverId = data.serverId?.trim();
			const ip = data.ip?.trim();

			if (!serverId || !ip) return json({ message: 'Server ID and IP required' }, { status: 400 });

			try {
				await db.update(minechatServers).set({ ip }).where(eq(minechatServers.serverId, serverId));
				return json({ success: true });
			} catch {
				return json({ message: 'Duplicate IP' }, { status: 400 });
			}
		}

		case 'serverDelete': {
			const serverId = data.serverId?.trim();
			if (!serverId) return json({ message: 'Server ID required' }, { status: 400 });

			await db.delete(minechatServers).where(eq(minechatServers.serverId, serverId));
			return json({ success: true });
		}

		default:
			return json({ message: 'Unknown action' }, { status: 400 });
	}
};
