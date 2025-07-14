import { json, type RequestEvent } from '@sveltejs/kit';
import { db } from '$db';
import { mcUsers } from '$db/schema';
import { eq } from 'drizzle-orm';
import { invalidMethod } from '$lib/server';

export async function POST(event: RequestEvent) {
	const { homeLocation, uuid } = await event.request.json();
	if (!homeLocation || !uuid) return json(false);

	await db.update(mcUsers).set({ homeLocation }).where(eq(mcUsers.uuid, uuid));
	return json(true);
}

export const GET = invalidMethod;
