import { Google } from 'arctic';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '$env/static/private';
import { PUBLIC_ORIGIN } from '$env/static/public';
import type { Cookies } from '@sveltejs/kit';
import { type RequestEvent } from '@sveltejs/kit';
import { generateToken, getUserByToken } from '$lib/server/models/User';
import { TokenType, type UserID } from '$types';
import { addDays, addMonths, addYears } from 'date-fns';
import { getDeviceByToken } from '$lib/server/models/device';
import { db } from '$db';
import { tokens } from '$db/schema';
import { eq } from 'drizzle-orm';
import { cookieData } from '$lib/server/index';

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
	throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are not set');
}

const redirect_url = `${PUBLIC_ORIGIN}/login/google/callback`;

export const google = new Google(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirect_url);

export async function createLogin(cookies: Cookies, userId: UserID, keep = false) {
	const token = await generateToken(userId, TokenType.Login, keep ? addMonths(new Date(), 1) : addDays(new Date(), 1));
	cookies.set('loginToken', token.token, cookieData(keep ? addMonths(new Date(), 1) : undefined));
	return token;
}

export async function authenticate(event: RequestEvent) {
	event.locals.user = null;
	event.locals.device = null;
	event.locals.apiSession = null;

	const deviceToken = event.cookies.get('deviceToken');
	if (deviceToken) {
		const device = await getDeviceByToken(deviceToken);
		if (device) {
			event.locals.device = device;
			const newExpires = addYears(new Date(), 1);
			const deviceToken = event.cookies.get('deviceToken') ?? '';
			event.cookies.set('deviceToken', deviceToken, cookieData(newExpires));
			await db.update(tokens).set({ expires: newExpires }).where(eq(tokens.token, deviceToken));

			const loginToken = event.cookies.get('loginToken');
			if (loginToken) {
				const user = await getUserByToken(loginToken);
				if (user) {
					event.locals.user = user;
				} else {
					event.cookies.set('loginToken', '', cookieData(new Date(0)));
				}
			}
		} else {
			event.cookies.set('deviceToken', '', cookieData(new Date(0)));
			event.cookies.set('loginToken', '', cookieData(new Date(0)));
		}
	}
}