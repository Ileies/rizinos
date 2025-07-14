import { json, type RequestEvent } from '@sveltejs/kit';
import { isOnline } from '$lib/server/models/User';
import { invalidMethod } from '$lib/server';
import type { UserID } from '$types';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event: RequestEvent) => {
	const { id } = await event.request.json();
	if (typeof id !== 'string') return json({ error: 'Invalid id' }, { status: 400 });
	return json(await isOnline(id as UserID));
}

export const GET = invalidMethod;
