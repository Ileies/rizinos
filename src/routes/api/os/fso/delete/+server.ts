import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$db';
import { files } from '$db/schema';
import { eq, sql } from 'drizzle-orm';
import { deleteBlobIfUnreferenced, listingPath } from '$lib/server/files';
import { FileType } from '$types';
import { invalidMethod } from '$lib/server';

export const GET = invalidMethod;

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) error(401, 'Nicht angemeldet.');

	const { id } = (await request.json()) as { id: string };
	if (!id) error(400, 'id fehlt.');

	const target = await db
		.select()
		.from(files)
		.where(sql`${files.id} = ${id} AND ${files.ownerId} = ${locals.user.id}`)
		.limit(1)
		.then((r) => r[0]);
	if (!target) error(404, 'Datei nicht gefunden.');

	const blobHashesToCheck: string[] = [];

	if (target.type === FileType.Directory) {
		// Collect all descendants
		const childListingPath = listingPath(target);
		const descendants = await db
			.select()
			.from(files)
			.where(
				sql`${files.path} LIKE ${childListingPath + '%'} AND ${files.ownerId} = ${locals.user.id}`
			);

		for (const d of descendants) {
			if (d.blobHash) blobHashesToCheck.push(d.blobHash);
		}

		// Delete all descendants
		await db
			.delete(files)
			.where(
				sql`${files.path} LIKE ${childListingPath + '%'} AND ${files.ownerId} = ${locals.user.id}`
			);
	}

	if (target.blobHash) blobHashesToCheck.push(target.blobHash);

	// Delete the target itself
	await db.delete(files).where(eq(files.id, id));

	// Clean up unreferenced blobs
	const uniqueHashes = [...new Set(blobHashesToCheck)];
	for (const hash of uniqueHashes) {
		await deleteBlobIfUnreferenced(hash);
	}

	return json({ ok: true });
};
