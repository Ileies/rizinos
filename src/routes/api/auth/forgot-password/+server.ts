import { json, type RequestHandler } from '@sveltejs/kit';
import { invalidMethod } from '$lib/server';
import { sendEmail } from '$lib/server/email';
import { getUserByEmail, generateToken } from '$lib/server/models/User';
import { TokenType } from '$types';
import { addHours } from 'date-fns';
import { PUBLIC_ORIGIN } from '$env/static/public';

export const POST: RequestHandler = async ({ request }) => {
	const { email } = (await request.json()) as { email?: string };

	if (!email) {
		return json({ error: 'Email is required.' }, { status: 400 });
	}

	// Immer Erfolg zurückgeben, um E-Mail-Enumeration zu verhindern
	const user = await getUserByEmail(email);
	if (!user) {
		return json({ success: true });
	}

	const expires = addHours(new Date(), 1);
	const token = await generateToken(user.id, TokenType.Reset, expires);
	const resetUrl = `https://${PUBLIC_ORIGIN}/reset-password?token=${encodeURIComponent(token.token)}`;

	await sendEmail({
		to: email,
		subject: 'Reset your password',
		category: 'transactional',
		preheader: 'Here is your link to reset your password.',
		greeting: `Hi ${user.firstName || user.username},`,
		blocks: [
			{
				type: 'text',
				content:
					'We received a request to reset the password for your account. Click the button below to set a new password.'
			},
			{
				type: 'alert',
				level: 'warning',
				content:
					"This link is only valid for 1 hour. If you didn't request this, you can safely ignore this email."
			}
		],
		cta: { label: 'Reset password', url: resetUrl }
	});

	return json({ success: true });
};

export const GET = invalidMethod;
