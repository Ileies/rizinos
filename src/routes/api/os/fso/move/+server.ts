import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$db';
import { files } from '$db/schema';
import { eq, sql } from 'drizzle-orm';
import { listingPath, toVFSEntry } from '$lib/server/files';
import { FileType } from '$types';
import { invalidMethod } from '$lib/server';

export const GET = invalidMethod;

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) error(401, 'Nicht angemeldet.');

	const { id, targetDirId, newName } = (await request.json()) as {
		id: string;
		targetDirId?: string | null;
		newName?: string;
	};
	if (!id) error(400, 'id fehlt.');

	const source = await db
		.select()
		.from(files)
		.where(sql`${files.id} = ${id} AND ${files.ownerId} = ${locals.user.id}`)
		.limit(1)
		.then((r) => r[0]);
	if (!source) error(404, 'Datei nicht gefunden.');

	// Determine new parent path
	let newParentPath = source.path;
	if (targetDirId !== undefined) {
		if (!targetDirId) {
			newParentPath = '/';
		} else {
			const targetDir = await db
				.select()
				.from(files)
				.where(sql`${files.id} = ${targetDirId} AND ${files.ownerId} = ${locals.user.id}`)
				.limit(1)
				.then((r) => r[0]);
			if (!targetDir) error(404, 'Zielverzeichnis nicht gefunden.');
			if (targetDir.type !== FileType.Directory) error(400, 'Ziel ist kein Verzeichnis.');

			// Prevent moving a directory into itself or its own subtree
			const sourceListing = listingPath(source);
			if (targetDir.path.startsWith(sourceListing) || targetDir.id === source.id) {
				error(400, 'Ein Verzeichnis kann nicht in sich selbst verschoben werden.');
			}
			newParentPath = listingPath(targetDir);
		}
	}

	// If directory is being moved, update all descendants' paths
	if (source.type === FileType.Directory && newParentPath !== source.path) {
		const oldListing = listingPath(source);
		const newListing = newParentPath + source.id + '/';
		await db.execute(
			sql`UPDATE file_meta
				SET path = ${newListing} || substring(path, ${oldListing.length + 1})
				WHERE path LIKE ${oldListing + '%'} AND owner_id = ${locals.user.id}`
		);
	}

	const [updated] = await db
		.update(files)
		.set({
			path: newParentPath,
			name: newName?.trim() ?? source.name,
			updatedAt: new Date()
		})
		.where(eq(files.id, id))
		.returning();

	return json(toVFSEntry(updated));
};
