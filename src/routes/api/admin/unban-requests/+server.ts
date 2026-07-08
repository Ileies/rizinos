import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$db';
import { dcUsers, mcUsers, unbanRequests, users } from '$db/schema';
import { eq } from 'drizzle-orm';
import { BanType, Role, type UserID } from '$types';
import { hasRole } from '$lib/server/models/User';
import { liftDiscordBan } from '$lib/server/discordBot';

function isAdmin(locals: App.Locals) {
	return !!locals.user && hasRole(locals.user, Role.Admin);
}

const forbidden = () => json({ message: 'Forbidden' }, { status: 403 });

export const GET: RequestHandler = async ({ locals }) => {
	if (!isAdmin(locals)) return forbidden();

	const pending = await db.query.unbanRequests.findMany({
		where: { status: 'pending' },
		orderBy: (unbanRequests, { asc }) => asc(unbanRequests.createdAt)
	});

	return json({ unbanRequests: pending });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!isAdmin(locals)) return forbidden();

	const { action, ...data } = (await request.json()) as Record<string, string> & { action: string };

	switch (action) {
		case 'approve': {
			const id = parseInt(data.id);
			if (!id) return json({ message: 'ID required' }, { status: 400 });

			const request = await db.query.unbanRequests.findFirst({ where: { id } });
			if (!request) return json({ message: 'Request not found' }, { status: 400 });

			switch (request.type) {
				case BanType.Minecraft:
					await db
						.update(mcUsers)
						.set({ bannedUntil: null, bannedReason: null, banId: null })
						.where(eq(mcUsers.uuid, request.subjectId));
					break;

				case BanType.Discord:
					await db
						.update(dcUsers)
						.set({ bannedUntil: null, bannedReason: null, banId: null })
						.where(eq(dcUsers.discordUserId, request.subjectId));
					await liftDiscordBan(request.subjectId);
					break;

				case BanType.Rizinos:
					await db
						.update(users)
						.set({ bannedUntil: null, bannedReason: null, banId: null })
						.where(eq(users.id, request.subjectId as UserID));
					break;
			}

			await db
				.update(unbanRequests)
				.set({ status: 'approved', resolvedAt: new Date() })
				.where(eq(unbanRequests.id, id));
			return json({ success: true });
		}

		case 'deny': {
			const id = parseInt(data.id);
			if (!id) return json({ message: 'ID required' }, { status: 400 });

			await db
				.update(unbanRequests)
				.set({ status: 'denied', resolvedAt: new Date() })
				.where(eq(unbanRequests.id, id));
			return json({ success: true });
		}

		default:
			return json({ message: 'Unknown action' }, { status: 400 });
	}
};
