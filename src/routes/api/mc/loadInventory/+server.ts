import { json } from '@sveltejs/kit';
import { invalidMethod } from '$lib/server';
import type { RequestEvent } from './$types';
import { db } from '$db';

export const GET = invalidMethod;

export async function POST(event: RequestEvent) {
	const { uuid, world } = (await event.request.json()) as { uuid: string; world: string };
	console.log('[mc/loadInventory:9] POST received:', { uuid, world });

	if (!uuid || !world) {
		console.log('[mc/loadInventory:12] Missing uuid or world, returning null');
		return json(null);
	}

	const worldGroup = (await db.query.mcWorlds.findFirst({
		columns: { groupName: true },
		where: { name: world }
	}))?.groupName;
	console.log('[mc/loadInventory:21] worldGroup for world="%s":', world, worldGroup ?? 'not found → returning null');
	if (!worldGroup) return json(null);

	const inventory = (await db.query.mcInventories.findFirst({
		columns: { inventory: true },
		where: { ownerUuid: uuid, worldGroup }
	}))?.inventory;
	console.log('[mc/loadInventory:28] inventory for uuid=%s worldGroup=%s: %s',
		uuid, worldGroup, inventory ? `${inventory.length} slots` : 'not found, returning empty array (40 slots)');

	return json(inventory ?? Array(40).fill(null));
}
