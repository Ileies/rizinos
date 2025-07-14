import { json, type RequestEvent } from '@sveltejs/kit';
import { db } from '$db';
import { mcInventories } from '$db/schema';
import { and, eq } from 'drizzle-orm';
import { invalidMethod } from '$lib/server';

export async function POST(event: RequestEvent) {
	const { uuid, world, inventory } = await event.request.json();
	let parsedInventory;

	try {
		parsedInventory = JSON.parse(inventory);
	} catch (e) {
		console.error(e);
		return json(false);
	}

	const worldGroup = (await db.query.mcWorlds.findFirst({
		columns: { group: true },
		where: (mcWorlds, { eq }) => eq(mcWorlds.name, world)
	}))?.group;
	if (!worldGroup) return json(false);

	const exists = (await db.query.mcInventories.findFirst({
		columns: { id: true },
		where: (mcInventories, { and, eq }) => and(
			eq(mcInventories.ownerUuid, uuid),
			eq(mcInventories.worldGroup, worldGroup)
		)
	}))?.id !== undefined;

	if (exists) {
		await db.update(mcInventories).set({ inventory: parsedInventory }).where(and(
			eq(mcInventories.ownerUuid, uuid),
			eq(mcInventories.worldGroup, worldGroup)
		));
	} else {
		await db.insert(mcInventories).values({ ownerUuid: uuid, worldGroup, inventory: parsedInventory });
	}
	return json(true);
}

export const GET = invalidMethod;
