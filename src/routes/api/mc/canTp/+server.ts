import { json } from '@sveltejs/kit';
import { canAccess } from '$lib/server/models/User';
import { invalidMethod } from '$lib/server';
import type { RequestEvent } from './$types';
import { db } from '$db';

export async function POST(event: RequestEvent) {
	const { uuid, from, to, op } = (await event.request.json()) as {
		uuid: string;
		from: string;
		to: string,
		op: boolean
	};

	if (!uuid || !from || !to) {
		return json({ error: 'Missing required parameters' }, { status: 400 });
	}

	const userData = (await db.query.mcUsers.findFirst({
		where: (mcUsers, { eq }) => eq(mcUsers.uuid, uuid),
		with: { user: { columns: { passwordHash: false, isOnline: false } } },
		columns: { userId: true }
	}))?.user;
	if (!userData) return json({ forbidden: true });

	const toWorld = await db.query.mcWorlds.findFirst({
		where: (mcWorlds, { eq }) => eq(mcWorlds.name, to),
		columns: { restrict: true },
		with: { group: true }
	});

	if (!toWorld) {
		// OPs can teleport to non-existent worlds
		return json(op ? { inventory: Array(40).fill(null) } : { forbidden: true });
	}

	// From here on we know toWorld exists

	if (!op && !canAccess(userData, toWorld.restrict) || !canAccess(userData, toWorld.group.restrict)) return json({ forbidden: true });

	const fromWorldGroup = (await db.query.mcWorlds.findFirst({
		where: (mcWorlds, { eq }) => eq(mcWorlds.name, from),
		columns: { group: true }
	}))?.group;
	if (toWorld.group.name === fromWorldGroup) {
		// Inventory is kept when teleporting within the same world group
		return json(null);
	}

	const inventory = (await db.query.mcInventories.findFirst({
		columns: { inventory: true },
		where: (mcInventories, { and, eq }) => and(
			eq(mcInventories.ownerUuid, uuid),
			eq(mcInventories.worldGroup, toWorld.group.name)
		)
	}))?.inventory;

	return json({
		gameMode: toWorld.group.gameMode,
		inventory: inventory ?? Array(40).fill(null)
	});
}

export const GET = invalidMethod;
