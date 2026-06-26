import { json, type RequestEvent } from '@sveltejs/kit';
import { db } from '$db';
import { mcUsers } from '$db/schema';
import { eq } from 'drizzle-orm';
import { invalidMethod } from '$lib/server';

export async function POST(event: RequestEvent) {
	const { homeLocation, uuid } = await event.request.json();
	console.log('[mc/setHome:8] POST received: uuid=%s, homeLocation=%s', uuid, homeLocation);

	if (!homeLocation || !uuid) {
		console.log('[mc/setHome:11] missing homeLocation or uuid, returning false');
		return json(false);
	}

	await db.update(mcUsers).set({ homeLocation }).where(eq(mcUsers.uuid, uuid));
	console.log('[mc/setHome:17] homeLocation updated for uuid=%s to: %s', uuid, homeLocation);
	return json(true);
}

export const GET = invalidMethod;
