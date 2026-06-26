import { json, type RequestEvent } from '@sveltejs/kit';
import { db } from '$db';
import { mcUsers } from '$db/schema';
import { eq, sql } from 'drizzle-orm';

import { invalidMethod } from '$lib/server';

export async function POST(event: RequestEvent) {
	const { uuid, permission } = await event.request.json();
	console.log('[mc/removePermission:9] POST received: uuid=%s, permission=%s', uuid, permission);
	await db.update(mcUsers).set({ permissions: sql`array_remove(${mcUsers.permissions}, ${permission})` }).where(eq(mcUsers.uuid, uuid));
	console.log('[mc/removePermission:11] permission "%s" removed from uuid=%s', uuid, permission);
	return json(true);
}

export const GET = invalidMethod;
