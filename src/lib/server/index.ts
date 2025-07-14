import { json } from '@sveltejs/kit';
import nodemailer from 'nodemailer';
import { PUBLIC_APP_NAME, PUBLIC_ORIGIN } from '$env/static/public';
import { SMTP_HOST, SMTP_PASSWORD, SMTP_USER } from '$env/static/private';
import * as Mail from 'nodemailer/lib/mailer';
import Logger from '$lib/server/models/Logger';
import { addYears } from 'date-fns';
import { dev } from '$app/environment';

export const invalidMethod = () => json({ message: 'Invalid method' });

export async function sendMail(mailOptions: Mail.Options): Promise<string | null> {
	mailOptions.from ??= `"${PUBLIC_APP_NAME}" <info@${PUBLIC_ORIGIN}>`;
	mailOptions.headers ??= {};
	(mailOptions.headers as Record<string, string>)['List-Unsubscribe'] = `<https://${Bun.env.PUBLIC_ORIGIN}/unsubscribe>`; // TODO: Implement unsubscribe link


	const transporter = nodemailer.createTransport({
		host: SMTP_HOST,
		port: 465,
		secure: true,
		auth: {
			user: SMTP_USER,
			pass: SMTP_PASSWORD
		}
	});

	const sentMessageInfo = await transporter.sendMail(mailOptions);

	if (!sentMessageInfo.accepted.length || sentMessageInfo.rejected.length) {
		Logger.error('Error sending email:', sentMessageInfo);
		return null;
	}
	return sentMessageInfo.messageId;
}

export function cookieData(expires: Date | undefined = addYears(new Date(), 1)) {
	return { path: '/', expires, domain: dev ? 'localhost' : PUBLIC_ORIGIN };
}
