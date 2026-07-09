import { json, type RequestHandler } from '@sveltejs/kit';
import { login } from '$lib/server/models/User';
import { completeLogin } from '$lib/server/auth';
import { invalidMethod } from '$lib/server';
import { PUBLIC_ORIGIN } from '$env/static/public';

export const POST: RequestHandler = async (event) => {
	const { request, locals } = event;

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
				error: `Dieser Account wurde gesperrt. Unban-Antrag: https://${PUBLIC_ORIGIN}/unban-request/?id=${user.banId}`
			},
			{ status: 403 }
		);
	}
	if (!user) {
		return json({ error: 'Invalid email or password.' }, { status: 402 });
	}

	await completeLogin(event, user.id, keep === true);

	return json({ success: true });
};

export const GET = invalidMethod;
