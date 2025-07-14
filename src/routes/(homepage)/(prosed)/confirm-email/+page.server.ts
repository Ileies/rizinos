import type { PageServerLoad } from './$types';
import { users } from '$db/schemaUsers';
import { getToken, revokeToken, tokenIsExpired } from '$lib/server/models/token';
import { TokenType } from '$types';
import { db } from '$db';

export const load: PageServerLoad = async ({ url }) => {
	const tokenString = url.searchParams.get('token');
	if (!tokenString) {
		return { status: 1 }; // no token provided
	}

	const token = await getToken(tokenString, TokenType.Verify);
	if (!token || tokenIsExpired(token)) {
		return { status: 2 }; // Invalid or expired token
	}
	const data = token.data as typeof users.$inferInsert;
	await revokeToken(tokenString);

	// Check if any unique user data has at the time of confirmation already been stored in another new user
	const existingUser = await db.query.users.findFirst({
		where: (users, { eq, or }) => or(
			eq(users.username, data.username),
			eq(users.email, data.email)
		),
		columns: { id: true }
	});

	if (existingUser) {
		return { status: 3 }; // A user with the same username or email already exists
	}

	await db.insert(users).values(data);

	return { status: 0 };
};
