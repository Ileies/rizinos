import { json } from '@sveltejs/kit';

import { invalidMethod } from '$lib/server';

export function POST() {
	return json(true);
}

export const GET = invalidMethod;
