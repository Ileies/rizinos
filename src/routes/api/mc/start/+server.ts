import { json } from '@sveltejs/kit';
import { invalidMethod } from '#lib/server/index.js';
import { db } from '$db';

export async function POST() {
	console.log('[mc/start:6] POST received (Minecraft server startup handshake)');
	// TODO: Maybe log server version
	const worth = await db.query.mcWorth.findMany();
	const warps = await db.query.mcWarps.findMany();
	console.log(
		'[mc/start:11] responding: version=%s, worth=%d entries, warps=%d entries',
		__APP_VERSION__,
		worth.length,
		warps.length
	);
	return json({ version: __APP_VERSION__, worth, warps });
}

export const GET = invalidMethod;
