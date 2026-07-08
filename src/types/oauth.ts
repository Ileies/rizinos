export type OAuthProvider = 'google' | 'discord';

export type OAuthPendingSignup = {
	provider: OAuthProvider;
	providerId: string;
	email: string;
	firstName: string | null;
	lastName: string | null;
};
