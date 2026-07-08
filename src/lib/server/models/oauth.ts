import { db } from '$db';
import { oauthAccounts } from '$db/schema';
import type { OAuthProvider, UserData, UserID } from '$types';

export async function getUserByOAuthAccount(
	provider: OAuthProvider,
	providerId: string
): Promise<UserData | undefined> {
	return db.query.oauthAccounts
		.findFirst({
			where: { provider, providerId },
			with: { user: { columns: { passwordHash: false, isOnline: false } } }
		})
		.then((data) => data?.user);
}

export async function linkOAuthAccount(
	userId: UserID,
	provider: OAuthProvider,
	providerId: string
): Promise<void> {
	await db.insert(oauthAccounts).values({ userId, provider, providerId });
}
