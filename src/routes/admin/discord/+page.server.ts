import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$db';
import { dcUsers } from '$db/schema';
import { eq } from 'drizzle-orm';
import { Role } from '$types';
import type { UserID } from '$types';
import { hasRole } from '$lib/server/models/User';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(302, '/login');
	if (!hasRole(locals.user, Role.Admin)) redirect(302, '/app');

	const [allDcUsers, allUsers] = await Promise.all([
		db.query.dcUsers.findMany({
			with: { user: { columns: { passwordHash: false, isOnline: false } } },
			orderBy: (dcUsers, { asc }) => asc(dcUsers.name)
		}),
		db.query.users.findMany({
			columns: { id: true, username: true },
			orderBy: (users, { asc }) => asc(users.username)
		})
	]);

	return { dcUsers: allDcUsers, users: allUsers };
};

function adminGuard(locals: App.Locals) {
	if (!locals.user || !hasRole(locals.user, Role.Admin)) return fail(403);
}

export const actions: Actions = {
	userCreate: async ({ request, locals }) => {
		const guard = adminGuard(locals);
		if (guard) return guard;

		const data = await request.formData();
		const name = (data.get('name') as string)?.trim();
		const discordUserId = (data.get('discordUserId') as string)?.trim();
		const userId = (data.get('userId') as string)?.trim();

		if (!name || !discordUserId || !userId) return fail(400, { message: 'Name, Discord ID, and User ID required' });

		try {
			await db.insert(dcUsers).values({ name, discordUserId, userId: userId as UserID });
			return { success: true };
		} catch {
			return fail(400, { message: 'Duplicate name, Discord ID, or user already linked' });
		}
	},

	userUpdate: async ({ request, locals }) => {
		const guard = adminGuard(locals);
		if (guard) return guard;

		const data = await request.formData();
		const discordUserId = (data.get('discordUserId') as string)?.trim();
		const name = (data.get('name') as string)?.trim();
		const userId = (data.get('userId') as string)?.trim();

		if (!discordUserId || !name || !userId) return fail(400, { message: 'Required fields missing' });

		try {
			await db.update(dcUsers).set({ name, userId: userId as UserID }).where(eq(dcUsers.discordUserId, discordUserId));
			return { success: true };
		} catch {
			return fail(400, { message: 'Duplicate name or user already linked' });
		}
	},

	userDelete: async ({ request, locals }) => {
		const guard = adminGuard(locals);
		if (guard) return guard;

		const data = await request.formData();
		const discordUserId = (data.get('discordUserId') as string)?.trim();

		if (!discordUserId) return fail(400, { message: 'Discord User ID required' });

		await db.delete(dcUsers).where(eq(dcUsers.discordUserId, discordUserId));
		return { success: true };
	}
};
