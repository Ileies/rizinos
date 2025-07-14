import { json } from '@sveltejs/kit';
import { invalidMethod } from '$lib/server';
import type { RequestEvent } from './$types';
import { db } from '$db';

export const GET = invalidMethod;

export async function POST(event: RequestEvent) {
	const { uuid, world } = (await event.request.json()) as { uuid: string; world: string };

	if (!uuid || !world) return json(null);

	const worldGroup = (await db.query.mcWorlds.findFirst({
		columns: { group: true },
		where: (mcWorlds, { eq }) => eq(mcWorlds.name, world)
	}))?.group;
	if (!worldGroup) return json(null);

	const inventory = (await db.query.mcInventories.findFirst({
		columns: { inventory: true },
		where: (mcInventories, { and, eq }) => and(
			eq(mcInventories.ownerUuid, uuid),
			eq(mcInventories.worldGroup, worldGroup)
		)
	}))?.inventory;

	return json(inventory ?? Array(40).fill(null));
}
