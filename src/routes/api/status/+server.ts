import { json, type RequestHandler } from '@sveltejs/kit';
import { loadPublicStatus } from '#lib/server/status/queries.js';

// Public and identical for every viewer, so it may be cached. Admin-only detail lives in
// /api/admin/status. The page polls this every 30 seconds.
export const GET: RequestHandler = async () =>
	json(await loadPublicStatus(), { headers: { 'cache-control': 'public, max-age=10' } });
