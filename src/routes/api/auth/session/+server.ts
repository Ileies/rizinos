import { json, type RequestHandler } from '@sveltejs/kit';
import { invalidMethod } from '$lib/server';

export const GET: RequestHandler = async ({ locals }) => {
	return json({ user: locals.user });
};

export const POST = invalidMethod;
