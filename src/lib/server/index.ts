import { json } from '@sveltejs/kit';
import { PUBLIC_ORIGIN } from '$env/static/public';
import { addYears } from 'date-fns';
import { dev } from '$app/environment';

export const invalidMethod = () => json({ message: 'Invalid method' });

export function cookieData(expires: Date | undefined = addYears(new Date(), 1)) {
	return { path: '/', expires, domain: dev ? 'localhost' : `.${PUBLIC_ORIGIN}` };
}
