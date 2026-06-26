import { json } from '@sveltejs/kit';

import { invalidMethod } from '$lib/server';

export function POST() {
	console.log('[mc/shutdown:5] POST received (Minecraft server shutdown notification)');
	return json(true);
}

export const GET = invalidMethod;
