import { json, type RequestHandler } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$db';
import { contactAttachments } from '$db/schema';
import { Role } from '$types';
import { hasRole } from '#lib/server/models/User.js';
import { readAttachment } from '#lib/server/contact/storage.js';

/** Serves a contact screenshot to admins only. Never public, never executable. */
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user || !hasRole(locals.user, Role.Admin)) {
		return json({ message: 'Forbidden' }, { status: 403 });
	}

	const [row] = await db
		.select()
		.from(contactAttachments)
		.where(eq(contactAttachments.id, params.id!));
	if (!row) return json({ message: 'Not found' }, { status: 404 });

	const file = readAttachment(row.storageKey);
	if (!(await file.exists())) return json({ message: 'File missing' }, { status: 404 });

	return new Response(file, {
		headers: {
			'Content-Type': row.mimeType,
			'Content-Length': String(row.size),
			'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(row.filename)}`,
			'X-Content-Type-Options': 'nosniff',
			'Content-Security-Policy': "default-src 'none'; sandbox",
			'Cache-Control': 'private, max-age=300'
		}
	});
};
