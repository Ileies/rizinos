import { Discord, Google } from 'arctic';
import {
	DISCORD_CLIENT_ID,
	DISCORD_CLIENT_SECRET,
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET
} from '$env/static/private';
import { PUBLIC_ORIGIN } from '$env/static/public';
import type { Cookies } from '@sveltejs/kit';
import { type RequestEvent } from '@sveltejs/kit';
import { generateToken, getUserByToken } from '$lib/server/models/User';
import { TokenType, type IpInfo, type OAuthProvider, type UserID } from '$types';
import { addDays, addMonths, addYears } from 'date-fns';
import { getDeviceByToken } from '$lib/server/models/device';
import { db } from '$db';
import { devices, tokens } from '$db/schema';
import { eq } from 'drizzle-orm';
import { cookieData } from '$lib/server/index';

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
	throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are not set');
}
if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
	throw new Error('DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET are not set');
}

const oauthCallbackUrl = (provider: OAuthProvider) =>
	`https://api.${PUBLIC_ORIGIN}/auth/oauth/${provider}/callback`;

export const oauthProviders = {
	google: new Google(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, oauthCallbackUrl('google')),
	discord: new Discord(DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, oauthCallbackUrl('discord'))
} satisfies Record<OAuthProvider, Google | Discord>;

export async function createLogin(cookies: Cookies, userId: UserID, keep = false) {
	const token = await generateToken(
		userId,
		TokenType.Login,
		keep ? addMonths(new Date(), 1) : addDays(new Date(), 1)
	);
	cookies.set('loginToken', token.token, cookieData(keep ? addMonths(new Date(), 1) : undefined));
	return token;
}

/**
 * Logs a user in and ensures the current device is registered/linked to the new session.
 * Shared by password login and OAuth login/signup completion.
 */
export async function completeLogin(event: RequestEvent, userId: UserID, keep = false) {
	const token = await createLogin(event.cookies, userId, keep);

	if (event.locals.device) {
		await db
			.update(devices)
			.set({ sessionToken: token.token })
			.where(eq(devices.deviceToken, event.locals.device.deviceToken));
	} else {
		const expires = addYears(new Date(), 1);
		const deviceToken = await generateToken(userId, TokenType.Device, expires);
		const { countryCode, city, timezone } = (await (
			await event.fetch('/api/os/ip', {
				method: 'POST',
				body: JSON.stringify({ ip: event.locals.ip })
			})
		).json()) as IpInfo;

		await db.insert(devices).values({
			deviceToken: deviceToken.token,
			sessionToken: token.token,
			userAgent: event.request.headers.get('user-agent') ?? '',
			ip: event.locals.ip,
			countryCode,
			city,
			timezone
		});
		event.cookies.set('deviceToken', deviceToken.token, cookieData(expires));
	}

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
