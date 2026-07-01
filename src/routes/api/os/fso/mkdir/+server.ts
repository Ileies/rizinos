import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$db';
import { files } from '$db/schema';
import { sql } from 'drizzle-orm';
import { listingPath, toVFSEntry } from '$lib/server/files';
import { FileType } from '$types';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) error(401, 'Nicht angemeldet.');

	const { name, dirId } = (await request.json()) as { name: string; dirId?: string };
	if (!name?.trim()) error(400, 'Name fehlt.');

	let parentPath = '/';
	if (dirId) {
		const parent = await db
			.select()
			.from(files)
			.where(sql`${files.id} = ${dirId} AND ${files.ownerId} = ${locals.user.id}`)
			.limit(1);
		if (!parent[0]) error(404, 'Elternverzeichnis nicht gefunden.');
		if (parent[0].type !== FileType.Directory) error(400, 'Nicht ein Verzeichnis.');
		parentPath = listingPath(parent[0]);
	}

	const [created] = await db
		.insert(files)
		.values({
			name: name.trim(),
			path: parentPath,
			type: FileType.Directory,
			ownerId: locals.user.id,
			groupId: 'users'
		})
		.returning();

	return json(toVFSEntry(created), { status: 201 });
};
