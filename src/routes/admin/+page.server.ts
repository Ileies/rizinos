import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$db';
import { users, apps } from '$db/schema';
import { eq } from 'drizzle-orm';
import { Role, type Restrict } from '$types';
import type { UserID } from '$types';
import { hasRole } from '$lib/server/models/User';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(302, '/login');
	if (!hasRole(locals.user, Role.Admin)) redirect(302, '/app');

	const [allUsers, allLogs, allApps] = await Promise.all([
		db.query.users.findMany({
			columns: { passwordHash: false, isOnline: false },
			orderBy: (users, { asc }) => asc(users.username)
		}),
		db.query.logs.findMany({
			orderBy: (logs, { desc }) => desc(logs.createdAt),
			limit: 500
		}),
		db.query.apps.findMany({
			with: { user: { columns: { username: true } } }
		})
	]);

	return { users: allUsers, logs: allLogs, apps: allApps };
};

function adminGuard(locals: App.Locals) {
	if (!locals.user || !hasRole(locals.user, Role.Admin)) return fail(403);
}

export const actions: Actions = {
	userCreate: async ({ request, locals }) => {
		const guard = adminGuard(locals);
		if (guard) return guard;

		const data = await request.formData();
		const username = (data.get('username') as string)?.trim();
		const email = (data.get('email') as string)?.trim();
		const firstName = (data.get('firstName') as string)?.trim();
		const lastName = (data.get('lastName') as string)?.trim();
		const password = (data.get('password') as string)?.trim();
		const gender = data.get('gender') as 'male' | 'female';
		const birthdateStr = data.get('birthdate') as string;

		if (!username || !email || !firstName || !lastName || !password || !gender || !birthdateStr)
			return fail(400, { message: 'All fields required' });

		const birthdate = new Date(birthdateStr);
		if (isNaN(birthdate.getTime())) return fail(400, { message: 'Invalid birthdate' });

		const passwordHash = await Bun.password.hash(password);

		try {
			await db.insert(users).values({ username, email, firstName, lastName, passwordHash, gender, birthdate });
			return { success: true };
		} catch {
			return fail(400, { message: 'Username or email already taken' });
		}
	},

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
	},

	appCreate: async ({ request, locals }) => {
		const guard = adminGuard(locals);
		if (guard) return guard;

		const data = await request.formData();
		const name = (data.get('name') as string)?.trim();
		const title = (data.get('title') as string)?.trim();
		const authorId = (data.get('authorId') as string)?.trim();
		const restrictRaw = (data.get('restrict') as string) ?? '';

		if (!name || !title || !authorId) return fail(400, { message: 'name, title, authorId required' });

		const restrict = (restrictRaw ? restrictRaw.split(',').filter(Boolean) : []) as Restrict[];

		try {
			await db.insert(apps).values({ name, title, authorId: authorId as UserID, restrict });
			return { success: true };
		} catch {
			return fail(400, { message: 'App name already taken' });
		}
	},

	appUpdate: async ({ request, locals }) => {
		const guard = adminGuard(locals);
		if (guard) return guard;

		const data = await request.formData();
		const id = (data.get('appId') as string)?.trim();
		const name = (data.get('name') as string)?.trim();
		const title = (data.get('title') as string)?.trim();
		const authorId = (data.get('authorId') as string)?.trim();
		const restrictRaw = (data.get('restrict') as string) ?? '';

		if (!id || !name || !title || !authorId) return fail(400, { message: 'Required fields missing' });

		const restrict = (restrictRaw ? restrictRaw.split(',').filter(Boolean) : []) as Restrict[];

		try {
			await db.update(apps).set({ name, title, authorId: authorId as UserID, restrict }).where(eq(apps.id, id));
			return { success: true };
		} catch {
			return fail(400, { message: 'App name already taken' });
		}
	},

	appDelete: async ({ request, locals }) => {
		const guard = adminGuard(locals);
		if (guard) return guard;

		const data = await request.formData();
		const id = (data.get('appId') as string)?.trim();

		if (!id) return fail(400, { message: 'App ID required' });

		await db.delete(apps).where(eq(apps.id, id));
		return { success: true };
	}
};
