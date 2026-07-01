import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$db';
import { blobs, files } from '$db/schema';
import { eq, sql } from 'drizzle-orm';
import { storagePath } from '$lib/server/files';
import { FileType } from '$types';

export const GET: RequestHandler = async ({ locals, params, url }) => {
	if (!locals.user) error(401, 'Nicht angemeldet.');

	const fileId = params.path.split('/')[0];
	if (!fileId) error(400, 'Datei-ID fehlt.');

	// Resolve the file, following symlinks one level
	let fileRow = await db
		.select()
		.from(files)
		.where(sql`${files.id} = ${fileId} AND ${files.ownerId} = ${locals.user.id}`)
		.limit(1)
		.then((r) => r[0]);
	if (!fileRow) error(404, 'Datei nicht gefunden.');

	if (fileRow.type === FileType.Symlink) {
		if (!fileRow.symlinkTarget) error(404, 'Symlink hat kein Ziel.');
		const target = await db
			.select()
			.from(files)
			.where(eq(files.id, fileRow.symlinkTarget))
			.limit(1)
			.then((r) => r[0]);
		if (!target) error(404, 'Symlink-Ziel nicht gefunden.');
		fileRow = target;
	}

	if (fileRow.type === FileType.Directory) error(400, 'Pfad ist ein Verzeichnis.');
	if (!fileRow.blobHash) error(404, 'Datei hat keinen Inhalt.');

	const blobRow = await db
		.select()
		.from(blobs)
		.where(eq(blobs.hash, fileRow.blobHash))
		.limit(1)
		.then((r) => r[0]);
	if (!blobRow) error(404, 'Blob nicht gefunden.');

	const bunFile = Bun.file(storagePath(blobRow.hash));
	if (!(await bunFile.exists())) error(404, 'Datei nicht auf Disk gefunden.');

	const forceDownload = url.searchParams.has('download');
	const disposition = forceDownload
		? `attachment; filename="${fileRow.name}"`
		: `inline; filename="${fileRow.name}"`;

	return new Response(bunFile, {
		headers: {
			'Content-Type': blobRow.mimeType,
			'Content-Disposition': disposition,
			'Content-Length': String(blobRow.size),
			'Cache-Control': 'private, max-age=3600'
		}
	});
};
