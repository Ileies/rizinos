import { json } from '@sveltejs/kit';
import { ORIGIN } from '$app/env/private';
import { addYears } from 'date-fns';
import { dev } from '$app/env';

export const invalidMethod = () => json({ message: 'Invalid method' });

export function cookieData(expires: Date | undefined = addYears(new Date(), 1)) {
	return { path: '/', expires, domain: dev ? 'localhost' : `.${new URL(ORIGIN).hostname}` };
}
