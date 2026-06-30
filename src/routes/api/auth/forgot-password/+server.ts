import { json, type RequestHandler } from '@sveltejs/kit';
import { invalidMethod, sendMail } from '$lib/server';
import { getUserByEmail, generateToken } from '$lib/server/models/User';
import { TokenType } from '$types';
import { addHours } from 'date-fns';
import { PUBLIC_APP_NAME, PUBLIC_ORIGIN } from '$env/static/public';

export const POST: RequestHandler = async ({ request }) => {
	const { email } = (await request.json()) as { email?: string };

	if (!email) {
		return json({ error: 'Email is required.' }, { status: 400 });
	}

	// Always return success to prevent email enumeration
	const user = await getUserByEmail(email);
	if (!user) {
		return json({ success: true });
	}

	const expires = addHours(new Date(), 1);
	const token = await generateToken(user.id, TokenType.Reset, expires);
	const resetUrl = `https://${PUBLIC_ORIGIN}/reset-password?token=${encodeURIComponent(token.token)}`;

	await sendMail({
		to: email,
		subject: `${PUBLIC_APP_NAME} - Password Reset`,
		html: `
			<p>You requested a password reset for your ${PUBLIC_APP_NAME} account.</p>
			<p><a href="${resetUrl}">Reset your password</a></p>
			<p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>
		`,
		text: `You requested a password reset for your ${PUBLIC_APP_NAME} account.\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, you can ignore this email.`
	});

	return json({ success: true });
};

export const GET = invalidMethod;
