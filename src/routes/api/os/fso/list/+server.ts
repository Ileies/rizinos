import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$db';
import { files } from '$db/schema';
import { eq, sql } from 'drizzle-orm';
import { listDirectory, listingPath } from '$lib/server/files';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) error(401, 'Nicht angemeldet.');

	const dirId = url.searchParams.get('id');

	let dirPath: string;
	if (!dirId) {
		dirPath = '/';
	} else {
		const dir = await db
			.select()
			.from(files)
			.where(sql`${files.id} = ${dirId} AND ${files.ownerId} = ${locals.user.id}`)
			.limit(1);
		if (!dir[0]) error(404, 'Verzeichnis nicht gefunden.');
		if (dir[0].type !== 'directory') error(400, 'Nicht ein Verzeichnis.');
		dirPath = listingPath(dir[0]);
	}

	return json(await listDirectory(dirPath, locals.user.id));
};
