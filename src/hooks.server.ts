import { error, type Handle, json } from '@sveltejs/kit';
import { db } from '$db';
import { users } from '$db/schema';
import { eq } from 'drizzle-orm';
import Logger from '$lib/server/models/Logger';
import { authenticate } from '$lib/server/auth';
import { sequence } from '@sveltejs/kit/hooks';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { getToken } from '$lib/server/models/token';
import { TokenType } from '$types';

const ignoredUrls = ['/api/mc/getCredit'];

// Reset online status for all users on server startup
await db.update(users).set({ isOnline: false }).where(eq(users.isOnline, true));

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});
	});

const checks: Handle = async ({ event, resolve }) => {
	// Get client IP, preferring forwarded IP from proxy if available
	event.locals.ip = event.request.headers.get('x-forwarded-for') ?? event.getClientAddress();

	// Skip logging for specific endpoints to reduce noise
	if (!ignoredUrls.includes(event.url.pathname)) console.log(new Date().toISOString(), event.url.href);

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
		if (event.url.host !== 'localhost') return json({ message: 'Not authenticated' }, { status: 401 });
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

export const handle: Handle = sequence(checks, api, handleParaglide);
