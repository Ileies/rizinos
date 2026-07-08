import { decodeIdToken, type OAuth2Tokens } from 'arctic';
import type { OAuthProvider } from '$types';

export interface OAuthProfile {
	providerId: string;
	email: string;
	emailVerified: boolean;
	firstName: string | null;
	lastName: string | null;
}

export async function fetchOAuthProfile(
	provider: OAuthProvider,
	oauthTokens: OAuth2Tokens
): Promise<OAuthProfile | null> {
	if (provider === 'google') {
		const claims = decodeIdToken(oauthTokens.idToken()) as {
			sub: string;
			email?: string;
			email_verified?: boolean;
			given_name?: string;
			family_name?: string;
		};
		if (!claims.email) return null;
		return {
			providerId: claims.sub,
			email: claims.email,
			emailVerified: claims.email_verified === true,
			firstName: claims.given_name ?? null,
			lastName: claims.family_name ?? null
		};
	}

	const response = await fetch('https://discord.com/api/users/@me', {
		headers: { authorization: `Bearer ${oauthTokens.accessToken()}` }
	});
	if (!response.ok) return null;
	const data = (await response.json()) as {
		id: string;
		email?: string | null;
		verified?: boolean;
		global_name?: string | null;
		username: string;
	};
	if (!data.email) return null;
	const [firstName, ...rest] = (data.global_name ?? data.username).split(' ');
	return {
		providerId: data.id,
		email: data.email,
		emailVerified: data.verified === true,
		firstName: firstName || null,
		lastName: rest.length ? rest.join(' ') : null
	};
}
