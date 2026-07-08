import { redirect, type RequestHandler } from '@sveltejs/kit';
import { generateCodeVerifier, generateState } from 'arctic';
import { addMinutes } from 'date-fns';
import { oauthProviders } from '$lib/server/auth';
import { cookieData, invalidMethod } from '$lib/server';
import type { OAuthProvider } from '$types';

const scopes: Record<OAuthProvider, string[]> = {
	google: ['openid', 'email', 'profile'],
	discord: ['identify', 'email']
};

export const GET: RequestHandler = async ({ params, url, cookies }) => {
	const provider = params.provider as OAuthProvider;
	if (!(provider in oauthProviders)) {
		return new Response('Unknown OAuth provider', { status: 400 });
	}

	const state = generateState();
	const codeVerifier = generateCodeVerifier();
	const authorizationUrl = oauthProviders[provider].createAuthorizationURL(
		state,
		codeVerifier,
		scopes[provider]
	);

	const expires = addMinutes(new Date(), 10);
	cookies.set('oauthState', state, cookieData(expires));
	cookies.set('oauthCodeVerifier', codeVerifier, cookieData(expires));

	const redirectTo = url.searchParams.get('redirect');
	if (redirectTo) {
		cookies.set('oauthRedirect', redirectTo, cookieData(expires));
	}

	redirect(302, authorizationUrl.toString());
};

export const POST = invalidMethod;
