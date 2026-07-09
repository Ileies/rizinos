import { redirect, type RequestHandler } from '@sveltejs/kit';
import { addMinutes } from 'date-fns';
import { PUBLIC_ORIGIN } from '$env/static/public';
import { completeLogin, oauthProviders } from '$lib/server/auth';
import { cookieData } from '$lib/server';
import { fetchOAuthProfile } from '$lib/server/oauthProfile';
import { getUserByOAuthAccount, linkOAuthAccount } from '$lib/server/models/oauth';
import { generateToken, getUserByEmail } from '$lib/server/models/User';
import { TokenType, type OAuthPendingSignup, type OAuthProvider } from '$types';

const loginUrl = `https://${PUBLIC_ORIGIN}/login`;
const appUrl = `https://app.${PUBLIC_ORIGIN}`;

export const GET: RequestHandler = async (event) => {
	const { params, url, cookies } = event;
	const provider = params.provider as OAuthProvider;

	const clearOauthCookies = () => {
		cookies.set('oauthState', '', cookieData(new Date(0)));
		cookies.set('oauthCodeVerifier', '', cookieData(new Date(0)));
		cookies.set('oauthRedirect', '', cookieData(new Date(0)));
	};

	if (!(provider in oauthProviders)) {
		redirect(302, `${loginUrl}?error=oauth_failed`);
	}

	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('oauthState');
	const codeVerifier = cookies.get('oauthCodeVerifier');
	const redirectTo = cookies.get('oauthRedirect') || appUrl;
	clearOauthCookies();

	if (!code || !state || !storedState || !codeVerifier || state !== storedState) {
		redirect(302, `${loginUrl}?error=oauth_failed`);
	}

	let oauthTokens;
	try {
		oauthTokens = await oauthProviders[provider].validateAuthorizationCode(code, codeVerifier);
	} catch {
		redirect(302, `${loginUrl}?error=oauth_failed`);
	}

	const profile = await fetchOAuthProfile(provider, oauthTokens);
	if (!profile) {
		redirect(302, `${loginUrl}?error=oauth_failed`);
	}

	const linkedUser = await getUserByOAuthAccount(provider, profile.providerId);
	if (linkedUser) {
		await completeLogin(event, linkedUser.id, true);
		redirect(302, redirectTo);
	}

	if (profile.emailVerified) {
		const existing = await getUserByEmail(profile.email);
		if (existing) {
			await linkOAuthAccount(existing.id, provider, profile.providerId);
			await completeLogin(event, existing.id, true);
			redirect(302, redirectTo);
		}
	}

	const pending: OAuthPendingSignup = {
		provider,
		providerId: profile.providerId,
		email: profile.email,
		firstName: profile.firstName,
		lastName: profile.lastName
	};
	const token = await generateToken(
		null,
		TokenType.OAuthSignup,
		addMinutes(new Date(), 15),
		pending
	);

	redirect(
		302,
		`https://${PUBLIC_ORIGIN}/signup/complete/?token=${encodeURIComponent(token.token)}`
	);
};
