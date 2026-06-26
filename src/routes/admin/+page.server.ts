import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$db';
import { users } from '$db/schema';
import { eq } from 'drizzle-orm';
import { Role } from '$types';
import { userAddRole, removeRole, hasRole } from '$lib/server/models/User';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(302, '/login');
	if (!hasRole(locals.user, Role.Admin)) redirect(302, '/app');

	const allUsers = await db.query.users.findMany({
		columns: { passwordHash: false, isOnline: false },
		orderBy: (users, { asc }) => asc(users.username)
	});

	return {
		users: allUsers
	};
};

export const actions: Actions = {
	userAddRole: async ({ request, locals }) => {
		if (!locals.user || !hasRole(locals.user, Role.Admin)) return fail(403);

		const data = await request.formData();
		const userId = data.get('userId') as string;
		const role = data.get('role') as Role;

		const user = await db.query.users.findFirst({
			where: { id: userId as any },
			columns: { passwordHash: false, isOnline: false }
		});
		if (!user) return fail(404, { message: 'User not found' });

		await userAddRole(user, role);
		return { success: true };
	},

	userRemoveRole: async ({ request, locals }) => {
		if (!locals.user || !hasRole(locals.user, Role.Admin)) return fail(403);

		const data = await request.formData();
		const userId = data.get('userId') as string;
		const role = data.get('role') as Role;

		const user = await db.query.users.findFirst({
			where: { id: userId as any },
			columns: { passwordHash: false, isOnline: false }
		});
		if (!user) return fail(404, { message: 'User not found' });

		await removeRole(user, role);
		return { success: true };
	},

	creditAdjust: async ({ request, locals }) => {
		if (!locals.user || !hasRole(locals.user, Role.Admin)) return fail(403);

		const data = await request.formData();
		const userId = data.get('userId') as string;
		const amount = parseInt(data.get('amount') as string) || 0;

		if (!userId) return fail(400, { message: 'User ID required' });

		const user = await db.query.users.findFirst({
			where: { id: userId as any },
			columns: { passwordHash: false, isOnline: false }
		});
		if (!user) return fail(404, { message: 'User not found' });

		const newCredit = Math.max(0, user.credit + amount);
		await db
			.update(users)
			.set({ credit: newCredit })
			.where(eq(users.id, userId as any));
		return { success: true };
	},

	creditSet: async ({ request, locals }) => {
		if (!locals.user || !hasRole(locals.user, Role.Admin)) return fail(403);

		const data = await request.formData();
		const userId = data.get('userId') as string;
		const credit = parseInt(data.get('credit') as string) || 0;

		if (!userId) return fail(400, { message: 'User ID required' });

		const newCredit = Math.max(0, credit);
		await db
			.update(users)
			.set({ credit: newCredit })
			.where(eq(users.id, userId as any));
		return { success: true };
	},

	userUpdate: async ({ request, locals }) => {
		if (!locals.user || !hasRole(locals.user, Role.Admin)) return fail(403);

		const data = await request.formData();
		const userId = data.get('userId') as string;
		const gender = data.get('gender') as string;

		if (!userId) return fail(400, { message: 'User ID required' });

		await db
			.update(users)
			.set({ gender: gender || null })
			.where(eq(users.id, userId as any));
		return { success: true };
	}
};
