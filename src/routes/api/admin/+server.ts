import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$db';
import { users, apps } from '$db/schema';
import { eq } from 'drizzle-orm';
import { Role, type Restrict, type UserID } from '$types';
import { hasRole } from '$lib/server/models/User';

function isAdmin(locals: App.Locals) {
	return !!locals.user && hasRole(locals.user, Role.Admin);
}

const forbidden = () => json({ message: 'Forbidden' }, { status: 403 });

export const GET: RequestHandler = async ({ locals }) => {
	if (!isAdmin(locals)) return forbidden();

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

	return json({ users: allUsers, logs: allLogs, apps: allApps });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!isAdmin(locals)) return forbidden();

	const { action, ...data } = (await request.json()) as Record<string, string> & { action: string };

	switch (action) {
		case 'userCreate': {
			const username = data.username?.trim();
			const email = data.email?.trim();
			const firstName = data.firstName?.trim();
			const lastName = data.lastName?.trim();
			const password = data.password?.trim();
			const gender = data.gender as 'male' | 'female';
			const birthdateStr = data.birthdate;

			if (!username || !email || !firstName || !lastName || !password || !gender || !birthdateStr)
				return json({ message: 'All fields required' }, { status: 400 });

			const birthdate = new Date(birthdateStr);
			if (isNaN(birthdate.getTime()))
				return json({ message: 'Invalid birthdate' }, { status: 400 });

			const passwordHash = await Bun.password.hash(password);

			try {
				await db
					.insert(users)
					.values({ username, email, firstName, lastName, passwordHash, gender, birthdate });
				return json({ success: true });
			} catch {
				return json({ message: 'Username or email already taken' }, { status: 400 });
			}
		}

		case 'userUpdateProfile': {
			const userId = data.userId;
			const username = data.username;
			const email = data.email;
			const gender = data.gender;
			const credit = parseInt(data.credit) || 0;

			if (!userId || !username || !email)
				return json({ message: 'Required fields missing' }, { status: 400 });

			const genderValue: 'male' | 'female' | undefined =
				gender === 'male' || gender === 'female' ? gender : undefined;

			try {
				await db
					.update(users)
					.set({ username, email, gender: genderValue, credit: Math.max(0, credit) })
					.where(eq(users.id, userId as UserID));
				return json({ success: true });
			} catch {
				return json({ message: 'Username or email already taken' }, { status: 400 });
			}
		}

		case 'userUpdatePassword': {
			const userId = data.userId;
			const newPassword = data.newPassword;

			if (!userId || !newPassword)
				return json({ message: 'User ID and password required' }, { status: 400 });

			const passwordHash = await Bun.password.hash(newPassword);
			await db
				.update(users)
				.set({ passwordHash })
				.where(eq(users.id, userId as UserID));
			return json({ success: true });
		}

		case 'userSetRoles': {
			const userId = data.userId;
			const rolesStr = data.roles;

			if (!userId) return json({ message: 'User ID required' }, { status: 400 });

			const roles = (rolesStr ? rolesStr.split(',').filter(Boolean) : []) as Role[];
			await db
				.update(users)
				.set({ roles })
				.where(eq(users.id, userId as UserID));
			return json({ success: true });
		}

		case 'userDelete': {
			const userId = data.userId;
			if (!userId) return json({ message: 'User ID required' }, { status: 400 });

			await db.delete(users).where(eq(users.id, userId as UserID));
			return json({ success: true });
		}

		case 'appCreate': {
			const name = data.name?.trim();
			const title = data.title?.trim();
			const authorId = data.authorId?.trim();
			const restrictRaw = data.restrict ?? '';

			if (!name || !title || !authorId)
				return json({ message: 'name, title, authorId required' }, { status: 400 });

			const restrict = (restrictRaw ? restrictRaw.split(',').filter(Boolean) : []) as Restrict[];

			try {
				await db.insert(apps).values({ name, title, authorId: authorId as UserID, restrict });
				return json({ success: true });
			} catch {
				return json({ message: 'App name already taken' }, { status: 400 });
			}
		}

		case 'appUpdate': {
			const id = data.appId?.trim();
			const name = data.name?.trim();
			const title = data.title?.trim();
			const authorId = data.authorId?.trim();
			const restrictRaw = data.restrict ?? '';

			if (!id || !name || !title || !authorId)
				return json({ message: 'Required fields missing' }, { status: 400 });

			const restrict = (restrictRaw ? restrictRaw.split(',').filter(Boolean) : []) as Restrict[];

			try {
				await db
					.update(apps)
					.set({ name, title, authorId: authorId as UserID, restrict })
					.where(eq(apps.id, id));
				return json({ success: true });
			} catch {
				return json({ message: 'App name already taken' }, { status: 400 });
			}
		}

		case 'appDelete': {
			const id = data.appId?.trim();
			if (!id) return json({ message: 'App ID required' }, { status: 400 });

			await db.delete(apps).where(eq(apps.id, id));
			return json({ success: true });
		}

		default:
			return json({ message: 'Unknown action' }, { status: 400 });
	}
};
