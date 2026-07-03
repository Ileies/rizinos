import { json, type RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';
import { type FormData, formSchema } from '$lib/formValidation';
import { invalidMethod } from '$lib/server';
import { sendEmail } from '$lib/server/email';
import { generateToken } from '$lib/server/models/User';
import { db } from '$db';
import { TokenType } from '$types';
import { addDays } from 'date-fns';
import { PUBLIC_APP_NAME, PUBLIC_ORIGIN } from '$env/static/public';
import snowflake from '$lib/server/models/Snowflake';
import type { UserID } from '$types';

export const POST: RequestHandler = async ({ request }) => {
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

	const existing = await db.query.users.findFirst({
		where: { OR: [{ username: data.username }, { email: data.email }] },
		columns: { username: true, email: true }
	});

	if (existing?.username === data.username) {
		return json({ errorId: 'signup_username_taken' as const }, { status: 409 });
	}
	if (existing?.email === data.email) {
		return json({ errorId: 'signup_email_taken' as const }, { status: 409 });
	}

	const passwordHash = await Bun.password.hash(data.password);
	const userId = snowflake.nextId() as UserID;

	const token = await generateToken(null, TokenType.Verify, addDays(new Date(), 1), {
		id: userId,
		username: data.username,
		email: data.email,
		passwordHash,
		birthdate: new Date(data.birthdate)
	});

	const confirmUrl = `https://${PUBLIC_ORIGIN}/confirm-email?token=${encodeURIComponent(token.token)}`;

	await sendEmail({
		to: data.email,
		subject: `${PUBLIC_APP_NAME} - E-Mail bestätigen`,
		category: 'transactional',
		preheader: 'Bestätige deine E-Mail-Adresse, um deinen Account zu aktivieren.',
		greeting: `Hallo ${data.username},`,
		blocks: [
			{
				type: 'text',
				content:
					'Willkommen bei RizinOS! Klicke auf den Button, um deine E-Mail-Adresse zu bestätigen und deinen Account zu aktivieren.'
			},
			{
				type: 'alert',
				level: 'warning',
				content:
					'Dieser Link ist 24 Stunden gültig. Hast du dich nicht registriert, kannst du diese E-Mail ignorieren.'
			}
		],
		cta: { label: 'E-Mail bestätigen', url: confirmUrl }
	});

	return json({ success: true });
};

export const GET = invalidMethod;
