import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$db';
import { minechatUsers, minechatHooks, minechatServers } from '$db/schema';
import { eq } from 'drizzle-orm';
import { Role } from '$types';
import { hasRole } from '$lib/server/models/User';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(302, '/login');
	if (!hasRole(locals.user, Role.Admin)) redirect(302, '/app');

	const [users, hooks, servers] = await Promise.all([
		db.query.minechatUsers.findMany(),
		db.query.minechatHooks.findMany({ with: { server: true } }),
		db.query.minechatServers.findMany({ with: { hook: true } })
	]);

	return { users, hooks, servers };
};

function adminGuard(locals: App.Locals) {
	if (!locals.user || !hasRole(locals.user, Role.Admin)) return fail(403);
}

export const actions: Actions = {
	userCreate: async ({ request, locals }) => {
		const guard = adminGuard(locals);
		if (guard) return guard;

		const data = await request.formData();
		const minecraftUuid = (data.get('minecraftUuid') as string)?.trim();
		const discordUserId = (data.get('discordUserId') as string)?.trim();
		const minecraftName = (data.get('minecraftName') as string)?.trim();
		const token = (data.get('token') as string)?.trim() || null;

		if (!minecraftUuid || !discordUserId || !minecraftName)
			return fail(400, { message: 'UUID, Discord ID, and MC name required' });

		try {
			await db.insert(minechatUsers).values({ minecraftUuid, discordUserId, minecraftName, token });
			return { success: true };
		} catch {
			return fail(400, { message: 'Duplicate UUID, Discord ID, or MC name' });
		}
	},

	userUpdate: async ({ request, locals }) => {
		const guard = adminGuard(locals);
		if (guard) return guard;

		const data = await request.formData();
		const minecraftUuid = (data.get('minecraftUuid') as string)?.trim();
		const discordUserId = (data.get('discordUserId') as string)?.trim();
		const minecraftName = (data.get('minecraftName') as string)?.trim();
		const token = (data.get('token') as string)?.trim() || null;

		if (!minecraftUuid || !discordUserId || !minecraftName)
			return fail(400, { message: 'Required fields missing' });

		try {
			await db.update(minechatUsers).set({ discordUserId, minecraftName, token }).where(eq(minechatUsers.minecraftUuid, minecraftUuid));
			return { success: true };
		} catch {
			return fail(400, { message: 'Duplicate Discord ID or MC name' });
		}
	},

	userDelete: async ({ request, locals }) => {
		const guard = adminGuard(locals);
		if (guard) return guard;

		const data = await request.formData();
		const minecraftUuid = (data.get('minecraftUuid') as string)?.trim();

		if (!minecraftUuid) return fail(400, { message: 'UUID required' });

		await db.delete(minechatUsers).where(eq(minechatUsers.minecraftUuid, minecraftUuid));
		return { success: true };
	},

	hookCreate: async ({ request, locals }) => {
		const guard = adminGuard(locals);
		if (guard) return guard;

		const data = await request.formData();
		const webhookId = (data.get('webhookId') as string)?.trim();
		const channelId = (data.get('channelId') as string)?.trim();
		const token = (data.get('token') as string)?.trim();
		const minecraftServerId = (data.get('minecraftServerId') as string)?.trim();
		const prefix = (data.get('prefix') as string)?.trim() || '<%1> ';

		if (!webhookId || !channelId || !token || !minecraftServerId)
			return fail(400, { message: 'All hook fields required' });

		try {
			await db.insert(minechatHooks).values({ webhookId, channelId, token, minecraftServerId, prefix });
			return { success: true };
		} catch {
			return fail(400, { message: 'Duplicate webhook or server already linked' });
		}
	},

	hookUpdate: async ({ request, locals }) => {
		const guard = adminGuard(locals);
		if (guard) return guard;

		const data = await request.formData();
		const webhookId = (data.get('webhookId') as string)?.trim();
		const channelId = (data.get('channelId') as string)?.trim();
		const token = (data.get('token') as string)?.trim();
		const minecraftServerId = (data.get('minecraftServerId') as string)?.trim();
		const prefix = (data.get('prefix') as string)?.trim() || '<%1> ';

		if (!webhookId || !channelId || !token || !minecraftServerId)
			return fail(400, { message: 'Required fields missing' });

		try {
			await db.update(minechatHooks).set({ channelId, token, minecraftServerId, prefix }).where(eq(minechatHooks.webhookId, webhookId));
			return { success: true };
		} catch {
			return fail(400, { message: 'Duplicate channel or server conflict' });
		}
	},

	hookDelete: async ({ request, locals }) => {
		const guard = adminGuard(locals);
		if (guard) return guard;

		const data = await request.formData();
		const webhookId = (data.get('webhookId') as string)?.trim();

		if (!webhookId) return fail(400, { message: 'Webhook ID required' });

		await db.delete(minechatHooks).where(eq(minechatHooks.webhookId, webhookId));
		return { success: true };
	},

	serverCreate: async ({ request, locals }) => {
		const guard = adminGuard(locals);
		if (guard) return guard;

		const data = await request.formData();
		const serverId = (data.get('serverId') as string)?.trim();
		const ip = (data.get('ip') as string)?.trim();

		if (!serverId || !ip) return fail(400, { message: 'Server ID and IP required' });

		try {
			await db.insert(minechatServers).values({ serverId, ip });
			return { success: true };
		} catch {
			return fail(400, { message: 'Duplicate server ID or IP' });
		}
	},

	serverUpdate: async ({ request, locals }) => {
		const guard = adminGuard(locals);
		if (guard) return guard;

		const data = await request.formData();
		const serverId = (data.get('serverId') as string)?.trim();
		const ip = (data.get('ip') as string)?.trim();

		if (!serverId || !ip) return fail(400, { message: 'Server ID and IP required' });

		try {
			await db.update(minechatServers).set({ ip }).where(eq(minechatServers.serverId, serverId));
			return { success: true };
		} catch {
			return fail(400, { message: 'Duplicate IP' });
		}
	},

	serverDelete: async ({ request, locals }) => {
		const guard = adminGuard(locals);
		if (guard) return guard;

		const data = await request.formData();
		const serverId = (data.get('serverId') as string)?.trim();

		if (!serverId) return fail(400, { message: 'Server ID required' });

		await db.delete(minechatServers).where(eq(minechatServers.serverId, serverId));
		return { success: true };
	}
};
