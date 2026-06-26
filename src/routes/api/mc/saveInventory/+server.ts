import { json, type RequestEvent } from '@sveltejs/kit';
import { db } from '$db';
import { mcInventories } from '$db/schema';
import { and, eq } from 'drizzle-orm';
import { invalidMethod } from '$lib/server';

export async function POST(event: RequestEvent) {
	const { uuid, world, inventory } = await event.request.json();
	console.log('[mc/saveInventory:8] POST received: uuid=%s, world=%s, inventory type=%s rawLength=%s',
		uuid, world, typeof inventory,
		typeof inventory === 'string' ? inventory.length : Array.isArray(inventory) ? inventory.length : '?');

	let parsedInventory;
	try {
		parsedInventory = JSON.parse(inventory);
		console.log('[mc/saveInventory:15] inventory parsed successfully: %d slots', parsedInventory.length);
	} catch (e) {
		console.error('[mc/saveInventory:17] Failed to parse inventory JSON:', e);
		return json(false);
	}

	const worldGroup = (await db.query.mcWorlds.findFirst({
		columns: { groupName: true },
		where: { name: world }
	}))?.groupName;
	console.log('[mc/saveInventory:25] worldGroup for world="%s":', world, worldGroup ?? 'not found → returning false');
	if (!worldGroup) return json(false);

	const existingId = (await db.query.mcInventories.findFirst({
		columns: { id: true },
		where: { ownerUuid: uuid, worldGroup }
	}))?.id;
	const exists = existingId !== undefined;
	console.log('[mc/saveInventory:33] existing record for uuid=%s worldGroup=%s: %s', uuid, worldGroup, exists ? `found (id=${existingId})` : 'not found');

	// TODO(drizzle-1.0): drizzle-orm's json() calls JSON.stringify in mapToDriverValue, then
	// bun-sql re-encodes the string as a JSON string literal → double-stringified in DB.
	// Fix once drizzle-orm 1.0 stable resolves the bun-sql serialization bug.
	if (exists) {
		console.log('[mc/saveInventory:36] updating existing inventory record');
		await db.update(mcInventories).set({ inventory: parsedInventory }).where(and(
			eq(mcInventories.ownerUuid, uuid),
			eq(mcInventories.worldGroup, worldGroup)
		));
	} else {
		console.log('[mc/saveInventory:42] inserting new inventory record');
		await db.insert(mcInventories).values({ ownerUuid: uuid, worldGroup, inventory: parsedInventory });
	}
	console.log('[mc/saveInventory:45] save complete for uuid=%s worldGroup=%s, returning true', uuid, worldGroup);
	return json(true);
}

export const GET = invalidMethod;
