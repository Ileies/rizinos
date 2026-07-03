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
		subject: 'Passwort zurücksetzen',
		category: 'transactional',
		preheader: 'Hier ist dein Link zum Zurücksetzen deines Passworts.',
		greeting: user.username ? `Hallo ${user.username},` : 'Hallo,',
		blocks: [
			{
				type: 'text',
				content:
					'Wir haben eine Anfrage erhalten, das Passwort für deinen Account zurückzusetzen. Klicke auf den Button, um ein neues Passwort zu vergeben.'
			},
			{
				type: 'alert',
				level: 'warning',
				content: 'Dieser Link ist nur 1 Stunde gültig. Hast du diese Anfrage nicht gestellt, kannst du diese E-Mail ignorieren.'
			}
		],
		cta: { label: 'Passwort zurücksetzen', url: resetUrl }
	});

	return json({ success: true });
};

export const GET = invalidMethod;
