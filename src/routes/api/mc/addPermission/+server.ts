import { json, type RequestEvent } from '@sveltejs/kit';
import { db } from '$db';
import { mcUsers } from '$db/schema';
import { eq, sql } from 'drizzle-orm';
import { invalidMethod } from '$lib/server';

export async function POST(event: RequestEvent) {
	const { uuid, permission } = await event.request.json();
	console.log('[mc/addPermission:8] POST received: uuid=%s, permission=%s', uuid, permission);
	await db
		.update(mcUsers)
		.set({ permissions: sql`array_append(${mcUsers.permissions}, ${permission})` })
		.where(eq(mcUsers.uuid, uuid));
	console.log('[mc/addPermission:10] permission "%s" added to uuid=%s', permission, uuid);
	return json(true);
}

export const GET = invalidMethod;
