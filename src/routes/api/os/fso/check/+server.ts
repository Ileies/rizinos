import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$db';
import { blobs } from '$db/schema';
import { inArray } from 'drizzle-orm';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) error(401, 'Nicht angemeldet.');

	const { hashes } = (await request.json()) as { hashes: string[] };
	if (!Array.isArray(hashes) || hashes.length === 0) return json({ existing: [] });

	const found = await db
		.select({ hash: blobs.hash })
		.from(blobs)
		.where(inArray(blobs.hash, hashes));

	return json({ existing: found.map((b) => b.hash) });
};
