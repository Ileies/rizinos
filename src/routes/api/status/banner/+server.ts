import { json, type RequestHandler } from '@sveltejs/kit';
import { loadStatusBanner } from '#lib/server/status/queries.js';

// Tiny payload for the site-wide and in-OS banners.
export const GET: RequestHandler = async () =>
	json(await loadStatusBanner(), { headers: { 'cache-control': 'public, max-age=30' } });
