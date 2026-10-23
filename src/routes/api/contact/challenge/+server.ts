import { json, type RequestHandler } from '@sveltejs/kit';
import { challengeFetch, clientIp, issueChallenge } from '#lib/server/contact/guard.js';

/** Hands the contact form a signed, single-use token. The form must wait a few seconds before sending it back. */
export const GET: RequestHandler = async ({ request, locals }) => {
	const ip = clientIp(request.headers.get('x-forwarded-for'), locals.ip);
	const limit = challengeFetch.peek(ip);
	if (!limit.ok) {
		return json(
			{ error: 'rate_limited', message: 'Too many requests.' },
			{ status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
		);
	}
	challengeFetch.record(ip);
	return json({ token: await issueChallenge() }, { headers: { 'Cache-Control': 'no-store' } });
};
