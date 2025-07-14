import { json } from '@sveltejs/kit';
import { invalidMethod, sendMail } from '$lib/server';
import type { RequestHandler } from './$types';

export const GET = invalidMethod;

export const POST: RequestHandler = async ({ request }) => {
	const { to, subject, text, html } = await request.json();

	// Validate the request
	if (!to || !subject || (!text && !html)) {
		return json({ success: false, error: 'Invalid request' }, { status: 400 });
	}

	// Configure the transporter
	const messageId = await sendMail({ to, subject, text, html });

	if (messageId) {
		return json({ success: true, messageId });
	}

	return json({ success: false, error: 'Error sending email' }, { status: 500 });
}
