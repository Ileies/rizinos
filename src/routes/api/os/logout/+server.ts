import { json, type RequestEvent } from '@sveltejs/kit';
import { getToken, revokeToken } from '$lib/server/models/token';
import { TokenType } from '$types';
import { invalidMethod } from '$lib/server';

export async function GET(event: RequestEvent) {
	const token = await getToken(event.cookies.get('loginToken') ?? '');
	if (!token) {
		return json(1);
	}
	if (token.type !== TokenType.Login) {
		return json(false);
	}
	await revokeToken(token.token);
	return json(true);
}

export const POST = invalidMethod;
