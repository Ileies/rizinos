import { json, type RequestHandler } from '@sveltejs/kit';
import { invalidMethod } from '$lib/server';
import { getToken, revokeToken, tokenIsExpired } from '$lib/server/models/token';
import { TokenType } from '$types';
import { db } from '$db';
import { tokens, users } from '$db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const passwordSchema = z
	.string()
	.min(10, 'Password must be at least 10 characters')
	.max(71, 'Password must be 71 characters or less')
	.regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
	.regex(/[a-z]/, 'Password must contain at least one lowercase letter')
	.regex(/\d/, 'Password must contain at least one number')
	.regex(/[\W_]/, 'Password must contain at least one special character');

export const POST: RequestHandler = async ({ request }) => {
	const { token: tokenString, password } = (await request.json()) as {
		token?: string;
		password?: string;
	};

	if (!tokenString || !password) {
		return json({ error: 'Token and password are required.' }, { status: 400 });
	}

	const validation = passwordSchema.safeParse(password);
	if (!validation.success) {
		return json(
			{ error: validation.error.issues[0]?.message ?? 'Invalid password.' },
			{ status: 400 }
		);
	}

	const token = await getToken(tokenString, TokenType.Reset);
	if (!token || tokenIsExpired(token) || !token.userId) {
		return json({ error: 'Invalid or expired reset token.' }, { status: 400 });
	}

	const passwordHash = await Bun.password.hash(password);

	await db.update(users).set({ passwordHash }).where(eq(users.id, token.userId));

	// Revoke reset token and all active sessions for this user
	await db.delete(tokens).where(eq(tokens.userId, token.userId));

	return json({ success: true });
};

export const GET = invalidMethod;
