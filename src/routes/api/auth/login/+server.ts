import { json, type RequestHandler } from '@sveltejs/kit';
import { generateToken, login } from '$lib/server/models/User';
import { TokenType, type IpInfo } from '$types';
import { addYears } from 'date-fns';
import { db } from '$db';
import { devices } from '$db/schema';
import { eq } from 'drizzle-orm';
import { createLogin } from '$lib/server/auth';
import { cookieData, invalidMethod } from '$lib/server';
import { PUBLIC_ORIGIN } from '$env/static/public';

export const POST: RequestHandler = async ({ request, cookies, locals, fetch }) => {
	const ip = locals.ip;

	if (locals.user) {
		return json({ error: 'Already logged in.' }, { status: 400 });
	}

	const { email, password, keep } = (await request.json()) as {
		email?: string;
		password?: string;
		keep?: boolean;
	};

	if (!email || !password) {
		return json({ error: 'Email and password are required.' }, { status: 401 });
	}

	const user = await login(email, password);
	if (user && 'banned' in user) {
		return json(
			{
				error: `Dieser Account wurde gesperrt. Unban-Antrag: https://${PUBLIC_ORIGIN}/unban-request?id=${user.banId}`
			},
			{ status: 403 }
		);
	}
	if (!user) {
		return json({ error: 'Invalid email or password.' }, { status: 402 });
	}

	const token = await createLogin(cookies, user.id, keep === true);

	if (locals.device) {
		await db
			.update(devices)
			.set({ sessionToken: token.token })
			.where(eq(devices.deviceToken, locals.device.deviceToken));
	} else {
		const expires = addYears(new Date(), 1);
		const deviceToken = await generateToken(user.id, TokenType.Device, expires);
		const { countryCode, city, timezone } = (await (
			await fetch('/api/os/ip', {
				method: 'POST',
				body: JSON.stringify({ ip })
			})
		).json()) as IpInfo;

		await db.insert(devices).values({
			deviceToken: deviceToken.token,
			sessionToken: token.token,
			userAgent: request.headers.get('user-agent') ?? '',
			ip,
			countryCode,
			city,
			timezone
		});
		cookies.set('deviceToken', deviceToken.token, cookieData(expires));
	}

	return json({ success: true });
};

export const GET = invalidMethod;
