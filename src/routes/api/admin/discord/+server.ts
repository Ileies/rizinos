import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$db';
import { dcUsers } from '$db/schema';
import { eq } from 'drizzle-orm';
import { Role, type UserID } from '$types';
import { hasRole } from '$lib/server/models/User';

function isAdmin(locals: App.Locals) {
	return !!locals.user && hasRole(locals.user, Role.Admin);
}

const forbidden = () => json({ message: 'Forbidden' }, { status: 403 });

export const GET: RequestHandler = async ({ locals }) => {
	if (!isAdmin(locals)) return forbidden();

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

	return json({ dcUsers: allDcUsers, users: allUsers });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!isAdmin(locals)) return forbidden();

	const { action, ...data } = (await request.json()) as Record<string, string> & { action: string };

	switch (action) {
		case 'userCreate': {
			const name = data.name?.trim();
			const discordUserId = data.discordUserId?.trim();
			const userId = data.userId?.trim();

			if (!name || !discordUserId || !userId)
				return json({ message: 'Name, Discord ID, and User ID required' }, { status: 400 });

			try {
				await db.insert(dcUsers).values({ name, discordUserId, userId: userId as UserID });
				return json({ success: true });
			} catch {
				return json(
					{ message: 'Duplicate name, Discord ID, or user already linked' },
					{ status: 400 }
				);
			}
		}

		case 'userUpdate': {
			const discordUserId = data.discordUserId?.trim();
			const name = data.name?.trim();
			const userId = data.userId?.trim();

			if (!discordUserId || !name || !userId)
				return json({ message: 'Required fields missing' }, { status: 400 });

			try {
				await db
					.update(dcUsers)
					.set({ name, userId: userId as UserID })
					.where(eq(dcUsers.discordUserId, discordUserId));
				return json({ success: true });
			} catch {
				return json({ message: 'Duplicate name or user already linked' }, { status: 400 });
			}
		}

		case 'userDelete': {
			const discordUserId = data.discordUserId?.trim();
			if (!discordUserId) return json({ message: 'Discord User ID required' }, { status: 400 });

			await db.delete(dcUsers).where(eq(dcUsers.discordUserId, discordUserId));
			return json({ success: true });
		}

		default:
			return json({ message: 'Unknown action' }, { status: 400 });
	}
};
