import { generateToken, login } from '$lib/server/models/User';
import type { IpInfo } from '$types';
import { TokenType } from '$types';
import { addYears } from 'date-fns';
import { fail, redirect } from '@sveltejs/kit';
import Logger from '$lib/server/models/Logger';
import { db } from '$db';
import { devices } from '$db/schema';
import { eq } from 'drizzle-orm';
import { createLogin } from '$lib/server/auth';
import { cookieData } from '$lib/server';

export const load = async ({ locals, request }) => {
	if (locals.user) redirect(303, '/');
	return { referrer: request.headers.toJSON() };
};

export const actions = {
	default: async ({ request, cookies, locals, fetch }) => {
		const ip = locals.ip;

		if (locals.user) {
			return fail(400, { error: 'Already logged in.' });
		}

		const data = await request.formData();
		const email = data.get('email')?.toString();
		const password = data.get('password')?.toString();
		const keep = data.get('keep')?.toString();

		if (!email || !password) {
			console.log({ email, password, keep, ip });
			return fail(401, { error: 'Email and password are required.' });
		}

		// TODO: Remove when in production
		Logger.debug('new login:', { email, password, keep, ip });

		const user = await login(email, password);
		if (!user) {
			return fail(402, { error: 'Invalid email or password.' });
		}

		const token = await createLogin(cookies, user.id, keep === 'true');

		console.log('Token:', token);

		// TODO: Make better use of the device token. How can this be used for security and ease of use?

		if (locals.device) {
			db.update(devices).set({ sessionToken: token.token }).where(eq(devices.deviceToken, locals.device.deviceToken));
		} else {
			const expires = addYears(new Date(), 1);
			const deviceToken = await generateToken(user.id, TokenType.Device, expires);
			const { countryCode, city, timezone } = await (await fetch('/api/os/ip', {
				method: 'POST',
				body: JSON.stringify({ ip })
			})).json() as IpInfo;

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
			// TODO: Notification or Email: New Login e.g. from Spain
		}

		//$user->action("LOGIN with IP ".ip." on ".$device->browser.", ".$device->os);
		//if(isset($_POST["tz"]) && $_POST["tz"] < 13 && $_POST["tz"] > -13) $db->set("main", "timezone", intval($_POST["tz"]), "id", uid);

		// TODO: When is the device token set?
		// TODO: All API returns in the App should have a same schema.

		redirect(303, request.referrer || '/');
	}
};