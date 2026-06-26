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
	console.log('[mc/canTp:13] POST received:', { uuid, from, to, op });

	if (!uuid || !from || !to) {
		console.log('[mc/canTp:16] Missing required parameters, returning 400');
		return json({ error: 'Missing required parameters' }, { status: 400 });
	}

	const userData = (await db.query.mcUsers.findFirst({
		where: { uuid },
		with: { user: { columns: { passwordHash: false, isOnline: false } } },
		columns: { userId: true }
	}))?.user;
	console.log('[mc/canTp:26] mcUsers lookup for uuid=%s:', uuid, userData ? `found` : 'not found → forbidden');
	if (!userData) return json({ forbidden: true });

	const toWorld = await db.query.mcWorlds.findFirst({
		where: { name: to },
		columns: { restrict: true, groupName: true }
	});
	console.log('[mc/canTp:33] toWorld lookup for "%s":', to, toWorld ?? 'not found');

	if (!toWorld) {
		console.log('[mc/canTp:36] toWorld not found - op=%s → returning %s', op, op ? 'empty inventory' : 'forbidden');
		return json(op ? { inventory: Array(40).fill(null) } : { forbidden: true });
	}

	const toWorldGroup = await db.query.mcWorldGroups.findFirst({
		where: { name: toWorld.groupName }
	});
	console.log('[mc/canTp:43] toWorldGroup lookup for "%s":', toWorld.groupName, toWorldGroup ?? 'not found → forbidden');
	if (!toWorldGroup) return json({ forbidden: true });

	const accessDenied = (!op && !canAccess(userData, toWorld.restrict)) || !canAccess(userData, toWorldGroup.restrict);
	console.log('[mc/canTp:47] access check: op=%s, canAccessWorld=%s, canAccessGroup=%s → denied=%s',
		op, canAccess(userData, toWorld.restrict), canAccess(userData, toWorldGroup.restrict), accessDenied);
	if (accessDenied) return json({ forbidden: true });

	const fromWorldGroup = (await db.query.mcWorlds.findFirst({
		where: { name: from },
		columns: { groupName: true }
	}))?.groupName;
	console.log('[mc/canTp:55] fromWorldGroup for "%s":', from, fromWorldGroup ?? 'not found');

	if (toWorldGroup.name === fromWorldGroup) {
		console.log('[mc/canTp:58] same world group (%s) → keeping inventory, returning null', toWorldGroup.name);
		return json(null);
	}

	const inventory = (await db.query.mcInventories.findFirst({
		columns: { inventory: true },
		where: { ownerUuid: uuid, worldGroup: toWorldGroup.name }
	}))?.inventory;
	console.log('[mc/canTp:66] inventory for uuid=%s worldGroup=%s: %s',
		uuid, toWorldGroup.name, inventory ? `${inventory.length} slots` : 'not found, returning empty (40 slots)');

	return json({
		gameMode: toWorldGroup.gameMode,
		inventory: inventory ?? Array(40).fill(null)
	});
}

export const GET = invalidMethod;
