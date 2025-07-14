import { json } from '@sveltejs/kit';
import { PUBLIC_VERSION } from '$env/static/public';
import { invalidMethod } from '$lib/server';
import { db } from '$db';

export async function POST() {
	// TODO: Maybe log server version
	const worth = await db.query.mcWorth.findMany();
	const warps = await db.query.mcWarps.findMany();
	return json({ version: PUBLIC_VERSION, worth, warps });
}

export const GET = invalidMethod;
