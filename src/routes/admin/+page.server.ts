import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$db';
import { users } from '$db/schema';
import { eq } from 'drizzle-orm';
import { Role } from '$types';
import type { UserID } from '$types';
import { hasRole } from '$lib/server/models/User';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(302, '/login');
	if (!hasRole(locals.user, Role.Admin)) redirect(302, '/app');

	const allUsers = await db.query.users.findMany({
		columns: { passwordHash: false, isOnline: false },
		orderBy: (users, { asc }) => asc(users.username)
	});

	return { users: allUsers };
};

function adminGuard(locals: App.Locals) {
	if (!locals.user || !hasRole(locals.user, Role.Admin)) return fail(403);
}

export const actions: Actions = {
	userUpdateProfile: async ({ request, locals }) => {
		const guard = adminGuard(locals);
		if (guard) return guard;

		const data = await request.formData();
		const userId = data.get('userId') as string;
		const username = data.get('username') as string;
		const email = data.get('email') as string;
		const gender = data.get('gender') as string;
		const credit = parseInt(data.get('credit') as string) || 0;

		if (!userId || !username || !email) return fail(400, { message: 'Required fields missing' });

		const genderValue: 'male' | 'female' | undefined =
			gender === 'male' || gender === 'female' ? gender : undefined;

		try {
			await db
				.update(users)
				.set({ username, email, gender: genderValue, credit: Math.max(0, credit) })
				.where(eq(users.id, userId as UserID));
			return { success: true };
		} catch {
			return fail(400, { message: 'Username or email already taken' });
		}
	},

	userUpdatePassword: async ({ request, locals }) => {
		const guard = adminGuard(locals);
		if (guard) return guard;

		const data = await request.formData();
		const userId = data.get('userId') as string;
		const newPassword = data.get('newPassword') as string;

		if (!userId || !newPassword) return fail(400, { message: 'User ID and password required' });

		const passwordHash = await Bun.password.hash(newPassword);
		await db.update(users).set({ passwordHash }).where(eq(users.id, userId as UserID));
		return { success: true };
	},

	userSetRoles: async ({ request, locals }) => {
		const guard = adminGuard(locals);
		if (guard) return guard;

		const data = await request.formData();
		const userId = data.get('userId') as string;
		const rolesStr = data.get('roles') as string;

		if (!userId) return fail(400, { message: 'User ID required' });

		const roles = (rolesStr ? rolesStr.split(',').filter(Boolean) : []) as Role[];
		await db.update(users).set({ roles }).where(eq(users.id, userId as UserID));
		return { success: true };
	},

	userDelete: async ({ request, locals }) => {
		const guard = adminGuard(locals);
		if (guard) return guard;

		const data = await request.formData();
		const userId = data.get('userId') as string;

		if (!userId) return fail(400, { message: 'User ID required' });

		await db.delete(users).where(eq(users.id, userId as UserID));
		return { success: true };
	}
};
