import { json, type RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';
import Logger from '$lib/server/models/Logger';
import { type FormData, formSchema } from '$lib/formValidation';
import { invalidMethod } from '$lib/server';

export const POST: RequestHandler = async ({ request, locals }) => {
	const body = (await request.json()) as Record<string, unknown>;

	let data: FormData;
	try {
		data = formSchema.parse(body);
	} catch (e) {
		if (e instanceof z.ZodError) {
			return json({ errorId: 'signup_server_error' as const }, { status: 400 });
		}
		return json({ errorId: 'signup_server_error' as const }, { status: 500 });
	}

	// Process the data (e.g., save to database)
	console.log('Valid data:', data);

	// TODO: Remove when in production
	Logger.debug('registration', { ...body, ip: locals.ip });

	return json({ success: true });
};

export const GET = invalidMethod;
