import { json, type RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';
import { formSchema } from '$lib/formValidation';
import { completeLogin } from '$lib/server/auth';
import { getUserByOAuthAccount, linkOAuthAccount } from '$lib/server/models/oauth';
import { getToken, revokeToken, tokenIsExpired } from '$lib/server/models/token';
import snowflake from '$lib/server/models/Snowflake';
import { db } from '$db';
import { users } from '$db/schema';
import { TokenType, type OAuthPendingSignup, type UserID } from '$types';

const completeSchema = formSchema.pick({ username: true, birthdate: true, password: true });

export const POST: RequestHandler = async (event) => {
	const { request, locals } = event;

	if (locals.user) {
		return json({ error: 'Already logged in.' }, { status: 400 });
	}

	const body = (await request.json()) as Record<string, unknown>;
	const { token: tokenString, ...fields } = body as { token?: string } & Record<string, unknown>;
	if (!tokenString) {
		return json({ errorId: 'oauth_invalid_token' as const }, { status: 400 });
	}

	let data: z.infer<typeof completeSchema>;
	try {
		data = completeSchema.parse(fields);
	} catch {
		return json({ errorId: 'signup_server_error' as const }, { status: 400 });
	}

	const token = await getToken(tokenString, TokenType.OAuthSignup);
	if (!token || tokenIsExpired(token)) {
		return json({ errorId: 'oauth_invalid_token' as const }, { status: 400 });
	}
	const pending = token.data as OAuthPendingSignup;

	const alreadyLinked = await getUserByOAuthAccount(pending.provider, pending.providerId);
	if (alreadyLinked) {
		await revokeToken(tokenString);
		await completeLogin(event, alreadyLinked.id, true);
		return json({ success: true });
	}

	const existing = await db.query.users.findFirst({
		where: { OR: [{ username: data.username }, { email: pending.email }] },
		columns: { username: true, email: true }
	});
	if (existing?.username === data.username) {
		return json({ errorId: 'signup_username_taken' as const }, { status: 409 });
	}
	if (existing?.email === pending.email) {
		return json({ errorId: 'signup_email_taken' as const }, { status: 409 });
	}

	const passwordHash = await Bun.password.hash(data.password);
	const userId = snowflake.nextId() as UserID;

	await db.insert(users).values({
		id: userId,
		username: data.username,
		email: pending.email,
		firstName: pending.firstName,
		lastName: pending.lastName,
		passwordHash,
		birthdate: new Date(data.birthdate)
	});
	await linkOAuthAccount(userId, pending.provider, pending.providerId);
	await revokeToken(tokenString);

	await completeLogin(event, userId, true);

	return json({ success: true });
};

/** Lets the frontend preview the pending OAuth signup (email, name) before asking for the missing fields. */
export const GET: RequestHandler = async ({ url }) => {
	const tokenString = url.searchParams.get('token');
	if (!tokenString) {
		return json({ errorId: 'oauth_invalid_token' as const }, { status: 400 });
	}

	const token = await getToken(tokenString, TokenType.OAuthSignup);
	if (!token || tokenIsExpired(token)) {
		return json({ errorId: 'oauth_invalid_token' as const }, { status: 400 });
	}
	const pending = token.data as OAuthPendingSignup;

	return json({
		provider: pending.provider,
		email: pending.email,
		firstName: pending.firstName,
		lastName: pending.lastName
	});
};
