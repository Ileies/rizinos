/**
 * Manages authentication and verification tokens in the system.
 * Handles token storage, retrieval, and expiration checking.
 */

import { db } from '$db';
import { tokens } from '$db/schema';
import { eq } from 'drizzle-orm';
import type { Token, TokenType } from '$types';

export async function getToken(
	token: string,
	type: TokenType | null = null
): Promise<Token | undefined> {
	return db.query.tokens.findFirst({
		where: type ? { token, type } : { token }
	});
}

export function tokenIsExpired(token: Token): boolean {
	return token.expires.getTime() < Date.now();
}

export async function revokeToken(token: string) {
	return db.delete(tokens).where(eq(tokens.token, token));
}
