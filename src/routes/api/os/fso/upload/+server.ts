import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$db';
import { blobs, files } from '$db/schema';
import { eq, sql } from 'drizzle-orm';
import { ensureBlob, hashBuffer, listingPath, toVFSEntry } from '$lib/server/files';
import { FileType } from '$types';
import { invalidMethod } from '$lib/server';

export const GET = invalidMethod;

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) error(401, 'Nicht angemeldet.');

	const data = await request.formData();
	const hash = data.get('hash') as string;
	const name = data.get('name') as string;
	const dirId = (data.get('dirId') as string) || null;
	const file = data.get('file') as File | null;

	if (!hash || !name) error(400, 'hash und name sind erforderlich.');

	// Resolve parent directory path
	let parentPath = '/';
	if (dirId) {
		const parent = await db
			.select()
			.from(files)
			.where(sql`${files.id} = ${dirId} AND ${files.ownerId} = ${locals.user.id}`)
			.limit(1);
		if (!parent[0]) error(404, 'Zielverzeichnis nicht gefunden.');
		if (parent[0].type !== FileType.Directory) error(400, 'Ziel ist kein Verzeichnis.');
		parentPath = listingPath(parent[0]);
	}

	if (file) {
		// Full upload: verify hash, write blob if new
		const actualHash = await hashBuffer(await file.arrayBuffer());
		if (actualHash !== hash) error(400, 'Hash stimmt nicht mit Dateiinhalt überein.');
		await ensureBlob(hash, file);
	} else {
		// Dedup fast-path: blob must already exist
		const existing = await db
			.select({ hash: blobs.hash })
			.from(blobs)
			.where(eq(blobs.hash, hash))
			.limit(1);
		if (!existing[0]) error(400, 'Blob nicht gefunden. Datei muss zuerst hochgeladen werden.');
	}

	const blobRow = await db
		.select()
		.from(blobs)
		.where(eq(blobs.hash, hash))
		.limit(1)
		.then((r) => r[0]);

	const [created] = await db
		.insert(files)
		.values({
			name,
			path: parentPath,
			type: FileType.File,
			ownerId: locals.user.id,
			groupId: 'users',
			blobHash: hash,
			size: blobRow.size,
			mimeType: blobRow.mimeType
		})
		.returning();

	return json(toVFSEntry(created), { status: 201 });
};
