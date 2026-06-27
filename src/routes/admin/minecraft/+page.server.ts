import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$db';
import { mcWarps, mcWorlds, mcWorldGroups, mcUsers, mcInventories } from '$db/schema';
import { eq, sql } from 'drizzle-orm';
import { Role, type Restrict } from '$types';
import { hasRole } from '$lib/server/models/User';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(302, '/login');
	if (!hasRole(locals.user, Role.Admin)) redirect(302, '/app');

	const [allWarps, allWorlds, allGroups, allMcUsers, allUsers] = await Promise.all([
		db.query.mcWarps.findMany(),
		db.query.mcWorlds.findMany(),
		db.query.mcWorldGroups.findMany(),
		db.query.mcUsers.findMany({
			with: { user: { columns: { passwordHash: false, isOnline: false } } }
		}),
		db.query.users.findMany({ columns: { id: true, username: true } })
	]);

	const assignedUserIds = new Set(allMcUsers.map((u) => u.userId));
	const unassignedUsers = allUsers.filter((u) => !assignedUserIds.has(u.id));

	return {
		warps: allWarps,
		worlds: allWorlds,
		groups: allGroups,
		mcUsers: allMcUsers,
		users: allUsers,
		unassignedUsers
	};
};

export const actions: Actions = {
	warpCreate: async ({ request, locals }) => {
		if (!locals.user || !hasRole(locals.user, Role.Admin)) return fail(403);

		const data = await request.formData();
		const name = data.get('name') as string;
		const location = data.get('location') as string;
		const restrict = ((data.get('restrict') as string)?.split(',').filter(Boolean) ||
			[]) as Restrict[];

		if (!name || !location) return fail(400, { message: 'Name and location required' });

		try {
			await db.insert(mcWarps).values({ name, location, restrict });
			return { success: true };
		} catch (e) {
			return fail(400, { message: 'Warp already exists' });
		}
	},

	warpDelete: async ({ request, locals }) => {
		if (!locals.user || !hasRole(locals.user, Role.Admin)) return fail(403);

		const data = await request.formData();
		const name = data.get('name') as string;

		if (!name) return fail(400, { message: 'Warp name required' });

		await db.delete(mcWarps).where(eq(mcWarps.name, name));
		return { success: true };
	},

	worldCreate: async ({ request, locals }) => {
		if (!locals.user || !hasRole(locals.user, Role.Admin)) return fail(403);

		const data = await request.formData();
		const name = data.get('name') as string;
		const groupName = data.get('groupName') as string;
		const restrict = ((data.get('restrict') as string)?.split(',').filter(Boolean) ||
			[]) as Restrict[];

		if (!name || !groupName) return fail(400, { message: 'Name and group required' });

		try {
			await db.insert(mcWorlds).values({ name, groupName, restrict });
			return { success: true };
		} catch (e) {
			return fail(400, { message: 'World already exists' });
		}
	},

	worldDelete: async ({ request, locals }) => {
		if (!locals.user || !hasRole(locals.user, Role.Admin)) return fail(403);

		const data = await request.formData();
		const name = data.get('name') as string;

		if (!name) return fail(400, { message: 'World name required' });

		await db.delete(mcWorlds).where(eq(mcWorlds.name, name));
		return { success: true };
	},

	groupCreate: async ({ request, locals }) => {
		if (!locals.user || !hasRole(locals.user, Role.Admin)) return fail(403);

		const data = await request.formData();
		const name = data.get('name') as string;
		const gameMode = parseInt(data.get('gameMode') as string) || 0;
		const restrict = ((data.get('restrict') as string)?.split(',').filter(Boolean) ||
			[]) as Restrict[];

		if (!name) return fail(400, { message: 'Name required' });

		try {
			await db.insert(mcWorldGroups).values({ name, gameMode, restrict });
			return { success: true };
		} catch (e) {
			return fail(400, { message: 'Group already exists' });
		}
	},

	groupDelete: async ({ request, locals }) => {
		if (!locals.user || !hasRole(locals.user, Role.Admin)) return fail(403);

		const data = await request.formData();
		const name = data.get('name') as string;

		if (!name) return fail(400, { message: 'Group name required' });

		await db.delete(mcWorldGroups).where(eq(mcWorldGroups.name, name));
		return { success: true };
	},

	mcUserCreate: async ({ request, locals }) => {
		if (!locals.user || !hasRole(locals.user, Role.Admin)) return fail(403);

		const data = await request.formData();
		const userId = parseInt(data.get('userId') as string);
		const name = (data.get('name') as string)?.trim();
		const uuid = (data.get('uuid') as string)?.trim();

		if (!userId || !name || !uuid) return fail(400, { message: 'All fields required' });

		try {
			await db.insert(mcUsers).values({ userId, name, uuid, permissions: [] });
			return { success: true };
		} catch (e) {
			return fail(400, { message: 'Player already exists' });
		}
	},

	mcUserDelete: async ({ request, locals }) => {
		if (!locals.user || !hasRole(locals.user, Role.Admin)) return fail(403);

		const data = await request.formData();
		const uuid = data.get('uuid') as string;

		if (!uuid) return fail(400, { message: 'UUID required' });

		try {
			await db.delete(mcUsers).where(eq(mcUsers.uuid, uuid));
			return { success: true };
		} catch (e) {
			return fail(400, { message: 'Failed to delete Minecraft user' });
		}
	},

	warpUpdate: async ({ request, locals }) => {
		if (!locals.user || !hasRole(locals.user, Role.Admin)) return fail(403);

		const data = await request.formData();
		const oldName = data.get('oldName') as string;
		const name = data.get('name') as string;
		let location = data.get('location') as string;
		const restrict = ((data.get('restrict') as string)?.split(',').filter(Boolean) ||
			[]) as Restrict[];

		if (!oldName || !name || !location) return fail(400, { message: 'All fields required' });

		await db
			.update(mcWarps)
			.set({ name, location, restrict })
			.where(eq(mcWarps.name, oldName));
		return { success: true };
	},

	worldUpdate: async ({ request, locals }) => {
		if (!locals.user || !hasRole(locals.user, Role.Admin)) return fail(403);

		const data = await request.formData();
		const oldName = data.get('oldName') as string;
		const name = data.get('name') as string;
		const groupName = data.get('groupName') as string;
		const restrict = ((data.get('restrict') as string)?.split(',').filter(Boolean) ||
			[]) as Restrict[];

		if (!oldName || !name || !groupName) return fail(400, { message: 'All fields required' });

		if (oldName !== name) {
			await Promise.all([
				db.update(mcWarps)
					.set({ location: sql`replace(${mcWarps.location}, ${'world=' + oldName + ','}, ${'world=' + name + ','})` })
					.where(sql`${mcWarps.location} like ${'world=' + oldName + ',%'}`),
				db.update(mcUsers)
					.set({ homeLocation: sql`replace(${mcUsers.homeLocation}, ${'world=' + oldName + ','}, ${'world=' + name + ','})` })
					.where(sql`${mcUsers.homeLocation} like ${'world=' + oldName + ',%'}`)
			]);
		}

		await db
			.update(mcWorlds)
			.set({ name, groupName, restrict })
			.where(eq(mcWorlds.name, oldName));
		return { success: true };
	},

	groupUpdate: async ({ request, locals }) => {
		if (!locals.user || !hasRole(locals.user, Role.Admin)) return fail(403);

		const data = await request.formData();
		const oldName = data.get('oldName') as string;
		const name = data.get('name') as string;
		const gameMode = parseInt(data.get('gameMode') as string) || 0;
		const restrict = ((data.get('restrict') as string)?.split(',').filter(Boolean) ||
			[]) as Restrict[];

		if (!oldName || !name) return fail(400, { message: 'Name required' });

		if (oldName !== name) {
			await Promise.all([
				db.update(mcWorlds).set({ groupName: name }).where(eq(mcWorlds.groupName, oldName)),
				db.update(mcInventories).set({ worldGroup: name }).where(eq(mcInventories.worldGroup, oldName))
			]);
		}

		await db
			.update(mcWorldGroups)
			.set({ name, gameMode, restrict })
			.where(eq(mcWorldGroups.name, oldName));
		return { success: true };
	},

	mcUserUpdate: async ({ request, locals }) => {
		if (!locals.user || !hasRole(locals.user, Role.Admin)) return fail(403);

		const data = await request.formData();
		const uuid = data.get('uuid') as string;
		const homeLocation = data.get('homeLocation') as string | null;
		const welcomeMessage = data.get('welcomeMessage') as string | null;

		if (!uuid) return fail(400, { message: 'UUID required' });

		await db
			.update(mcUsers)
			.set({
				homeLocation: homeLocation || null,
				welcomeMessage: welcomeMessage || null
			})
			.where(eq(mcUsers.uuid, uuid));
		return { success: true };
	},

	mcUserUpdatePermissions: async ({ request, locals }) => {
		if (!locals.user || !hasRole(locals.user, Role.Admin)) return fail(403);

		const data = await request.formData();
		const uuid = data.get('uuid') as string;
		const permissionsStr = data.get('permissions') as string;

		if (!uuid) return fail(400, { message: 'UUID required' });

		const permissions = permissionsStr
			.split(',')
			.map(p => p.trim())
			.filter(Boolean);

		await db
			.update(mcUsers)
			.set({ permissions })
			.where(eq(mcUsers.uuid, uuid));
		return { success: true };
	},

	mcUserBan: async ({ request, locals }) => {
		if (!locals.user || !hasRole(locals.user, Role.Admin)) return fail(403);

		const data = await request.formData();
		const uuid = data.get('uuid') as string;
		const until = data.get('until') as string;
		const reason = (data.get('reason') as string) || null;

		if (!uuid) return fail(400, { message: 'UUID required' });

		const bannedUntil = until ? new Date(until) : null;
		await db
			.update(mcUsers)
			.set({ bannedUntil, bannedReason: bannedUntil ? reason : null })
			.where(eq(mcUsers.uuid, uuid));
		return { success: true };
	},

	mcUserMute: async ({ request, locals }) => {
		if (!locals.user || !hasRole(locals.user, Role.Admin)) return fail(403);

		const data = await request.formData();
		const uuid = data.get('uuid') as string;
		const until = data.get('until') as string;

		if (!uuid) return fail(400, { message: 'UUID required' });

		const mutedUntil = until ? new Date(until) : null;
		await db
			.update(mcUsers)
			.set({ mutedUntil })
			.where(eq(mcUsers.uuid, uuid));
		return { success: true };
	}
};
