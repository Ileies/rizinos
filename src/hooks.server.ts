import { error, type Handle, json } from '@sveltejs/kit';
import { db } from '$db';
import { users } from '$db/schema';
import { eq } from 'drizzle-orm';
import Logger from '$lib/server/models/Logger';
import { authenticate } from '$lib/server/auth';
import { sequence } from '@sveltejs/kit/hooks';
import { getToken } from '$lib/server/models/token';
import { TokenType } from '$types';
import { dev } from '$app/environment';
import { mkdir } from 'fs/promises';
const ignoredUrls = ['/api/mc/getCredit'];

const CORS_ORIGIN = 'https://rizinos.com';
const CORS_HEADERS = {
	'Access-Control-Allow-Origin': CORS_ORIGIN,
	'Access-Control-Allow-Credentials': 'true',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

// Reset online status for all users on server startup
await db.update(users).set({ isOnline: false }).where(eq(users.isOnline, true));

if (dev) await mkdir('./uploads', { recursive: true });

const checks: Handle = async ({ event, resolve }) => {
	// Get client IP, preferring forwarded IP from proxy if available
	event.locals.ip = event.request.headers.get('x-forwarded-for') ?? event.getClientAddress();

	// Skip logging for specific endpoints to reduce noise
	if (!ignoredUrls.includes(event.url.pathname))
		console.log(new Date().toISOString(), event.url.href);

	// Log POST requests with details for debugging
	if (event.request.method === 'POST' && event.url.pathname === '/login') {
		console.log('POST /login request details:', {
			origin: event.request.headers.get('origin'),
			referer: event.request.headers.get('referer'),
			contentType: event.request.headers.get('content-type'),
			cookie: event.request.headers.get('cookie') ? 'present' : 'missing',
			host: event.request.headers.get('host')
		});
	}

	// Verify database connectivity
	await db.execute('select 1').catch((e: unknown) => {
		Logger.error('Database is offline.', e);
		error(500, { message: 'Database is offline.' });
	});

	// Authenticate the request
	await authenticate(event);

	return resolve(event);
};

const api: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.startsWith('/api/mc/')) {
		if (event.url.hostname !== 'localhost')
			return json({ message: 'Not authenticated' }, { status: 401 });
	}

	if (event.url.pathname.startsWith('/api/')) {
		const apiToken = event.request.headers.get('Authorization')?.replace('Bearer ', '');
		if (apiToken) {
			const token = await getToken(apiToken, TokenType.Api);
			if (!token) {
				error(401, 'Unauthorized');
			}
			event.locals.apiSession = token.data as ApiSession;
		}
	}

	return resolve(event);
};

const cors: Handle = async ({ event, resolve }) => {
	if (event.request.method === 'OPTIONS') {
		return new Response(null, { status: 204, headers: CORS_HEADERS });
	}
	const response = await resolve(event);
	Object.entries(CORS_HEADERS).forEach(([k, v]) => response.headers.set(k, v));
	return response;
};

export const handle: Handle = sequence(cors, checks, api);
