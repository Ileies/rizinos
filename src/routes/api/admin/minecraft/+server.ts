import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$db';
import { mcWarps, mcWorlds, mcWorldGroups, mcUsers, mcInventories } from '$db/schema';
import { eq, sql } from 'drizzle-orm';
import { BanType, Role, type Restrict, type UserID } from '$types';
import { hasRole } from '$lib/server/models/User';
import { notifyBan } from '$lib/server/discordBot';

function isAdmin(locals: App.Locals) {
	return !!locals.user && hasRole(locals.user, Role.Admin);
}

const forbidden = () => json({ message: 'Forbidden' }, { status: 403 });

export const GET: RequestHandler = async ({ locals }) => {
	if (!isAdmin(locals)) return forbidden();

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

	return json({
		warps: allWarps,
		worlds: allWorlds,
		groups: allGroups,
		mcUsers: allMcUsers,
		users: allUsers,
		unassignedUsers
	});
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!isAdmin(locals)) return forbidden();

	const { action, ...data } = (await request.json()) as Record<string, string> & { action: string };

	const parseRestrict = (raw?: string) => (raw?.split(',').filter(Boolean) || []) as Restrict[];

	switch (action) {
		case 'warpCreate': {
			const name = data.name;
			const location = data.location;
			const restrict = parseRestrict(data.restrict);

			if (!name || !location)
				return json({ message: 'Name and location required' }, { status: 400 });

			try {
				await db.insert(mcWarps).values({ name, location, restrict });
				return json({ success: true });
			} catch {
				return json({ message: 'Warp already exists' }, { status: 400 });
			}
		}

		case 'warpDelete': {
			const name = data.name;
			if (!name) return json({ message: 'Warp name required' }, { status: 400 });

			await db.delete(mcWarps).where(eq(mcWarps.name, name));
			return json({ success: true });
		}

		case 'worldCreate': {
			const name = data.name;
			const groupName = data.groupName;
			const restrict = parseRestrict(data.restrict);

			if (!name || !groupName) return json({ message: 'Name and group required' }, { status: 400 });

			try {
				await db.insert(mcWorlds).values({ name, groupName, restrict });
				return json({ success: true });
			} catch {
				return json({ message: 'World already exists' }, { status: 400 });
			}
		}

		case 'worldDelete': {
			const name = data.name;
			if (!name) return json({ message: 'World name required' }, { status: 400 });

			await db.delete(mcWorlds).where(eq(mcWorlds.name, name));
			return json({ success: true });
		}

		case 'groupCreate': {
			const name = data.name;
			const gameMode = parseInt(data.gameMode) || 0;
			const restrict = parseRestrict(data.restrict);

			if (!name) return json({ message: 'Name required' }, { status: 400 });

			try {
				await db.insert(mcWorldGroups).values({ name, gameMode, restrict });
				return json({ success: true });
			} catch {
				return json({ message: 'Group already exists' }, { status: 400 });
			}
		}

		case 'groupDelete': {
			const name = data.name;
			if (!name) return json({ message: 'Group name required' }, { status: 400 });

			await db.delete(mcWorldGroups).where(eq(mcWorldGroups.name, name));
			return json({ success: true });
		}

		case 'mcUserCreate': {
			const userId = data.userId?.trim() as UserID;
			const name = data.name?.trim();
			const uuid = data.uuid?.trim();

			if (!userId || !name || !uuid)
				return json({ message: 'All fields required' }, { status: 400 });

			try {
				await db.insert(mcUsers).values({ userId, name, uuid, permissions: [] });
				return json({ success: true });
			} catch {
				return json({ message: 'Player already exists' }, { status: 400 });
			}
		}

		case 'mcUserDelete': {
			const uuid = data.uuid;
			if (!uuid) return json({ message: 'UUID required' }, { status: 400 });

			try {
				await db.delete(mcUsers).where(eq(mcUsers.uuid, uuid));
				return json({ success: true });
			} catch {
				return json({ message: 'Failed to delete Minecraft user' }, { status: 400 });
			}
		}

		case 'warpUpdate': {
			const oldName = data.oldName;
			const name = data.name;
			const location = data.location;
			const restrict = parseRestrict(data.restrict);

			if (!oldName || !name || !location)
				return json({ message: 'All fields required' }, { status: 400 });

			await db.update(mcWarps).set({ name, location, restrict }).where(eq(mcWarps.name, oldName));
			return json({ success: true });
		}

		case 'worldUpdate': {
			const oldName = data.oldName;
			const name = data.name;
			const groupName = data.groupName;
			const restrict = parseRestrict(data.restrict);

			if (!oldName || !name || !groupName)
				return json({ message: 'All fields required' }, { status: 400 });

			if (oldName !== name) {
				await Promise.all([
					db
						.update(mcWarps)
						.set({
							location: sql`replace(${mcWarps.location}, ${'world=' + oldName + ','}, ${'world=' + name + ','})`
						})
						.where(sql`${mcWarps.location} like ${'world=' + oldName + ',%'}`),
					db
						.update(mcUsers)
						.set({
							homeLocation: sql`replace(${mcUsers.homeLocation}, ${'world=' + oldName + ','}, ${'world=' + name + ','})`
						})
						.where(sql`${mcUsers.homeLocation} like ${'world=' + oldName + ',%'}`)
				]);
			}

			await db
				.update(mcWorlds)
				.set({ name, groupName, restrict })
				.where(eq(mcWorlds.name, oldName));
			return json({ success: true });
		}

		case 'groupUpdate': {
			const oldName = data.oldName;
			const name = data.name;
			const gameMode = parseInt(data.gameMode) || 0;
			const restrict = parseRestrict(data.restrict);

			if (!oldName || !name) return json({ message: 'Name required' }, { status: 400 });

			if (oldName !== name) {
				await Promise.all([
					db.update(mcWorlds).set({ groupName: name }).where(eq(mcWorlds.groupName, oldName)),
					db
						.update(mcInventories)
						.set({ worldGroup: name })
						.where(eq(mcInventories.worldGroup, oldName))
				]);
			}

			await db
				.update(mcWorldGroups)
				.set({ name, gameMode, restrict })
				.where(eq(mcWorldGroups.name, oldName));
			return json({ success: true });
		}

		case 'mcUserUpdate': {
			const uuid = data.uuid;
			const homeLocation = data.homeLocation;
			const welcomeMessage = data.welcomeMessage;

			if (!uuid) return json({ message: 'UUID required' }, { status: 400 });

			await db
				.update(mcUsers)
				.set({ homeLocation: homeLocation || null, welcomeMessage: welcomeMessage || null })
				.where(eq(mcUsers.uuid, uuid));
			return json({ success: true });
		}

		case 'mcUserUpdatePermissions': {
			const uuid = data.uuid;
			const permissionsStr = data.permissions;

			if (!uuid) return json({ message: 'UUID required' }, { status: 400 });

			const permissions = (permissionsStr ?? '')
				.split(',')
				.map((p) => p.trim())
				.filter(Boolean);

			await db.update(mcUsers).set({ permissions }).where(eq(mcUsers.uuid, uuid));
			return json({ success: true });
		}

		case 'mcUserBan': {
			const uuid = data.uuid;
			const until = data.until;
			const reason = data.reason || null;

			if (!uuid) return json({ message: 'UUID required' }, { status: 400 });

			const bannedUntil = until ? new Date(until) : null;
			await db
				.update(mcUsers)
				.set({ bannedUntil, bannedReason: bannedUntil ? reason : null })
				.where(eq(mcUsers.uuid, uuid));

			if (bannedUntil) void notifyBan(BanType.Minecraft, uuid, reason, bannedUntil);
			return json({ success: true });
		}

		case 'mcUserMute': {
			const uuid = data.uuid;
			const until = data.until;

			if (!uuid) return json({ message: 'UUID required' }, { status: 400 });

			const mutedUntil = until ? new Date(until) : null;
			await db.update(mcUsers).set({ mutedUntil }).where(eq(mcUsers.uuid, uuid));
			return json({ success: true });
		}

		default:
			return json({ message: 'Unknown action' }, { status: 400 });
	}
};
