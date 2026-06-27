import { z } from 'zod';
import { fail, redirect } from '@sveltejs/kit';
import Logger from '$lib/server/models/Logger';
import { type FormData, formSchema } from '$lib/formValidation';

export const load = ({ locals }) => {
	if (locals.user) redirect(303, '/');
};

export const actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();

		const body = Object.fromEntries(formData);
		try {
			const data: FormData = formSchema.parse(body);

			// Process the data (e.g., save to database)
			console.log('Valid data:', data);
		} catch (e) {
			if (e instanceof z.ZodError) {
				return fail(400, { errorId: 'signup_server_error' as const });
			}

			return fail(500, { errorId: 'signup_server_error' as const });
		}

		// TODO: Remove when in production
		Logger.debug('registration', { ...body, ip: locals.ip });

		/*
		// Check if username already exists
		const existingUser = await users.findOne({ where: { username } });
		if (existingUser) {
			return fail(400, { fieldErrors: { username: 'signup_username_taken' as const } });
		}

		// Check if email already exists
		const existingEmailUser = await users.findOne({ where: { email } });
		if (existingEmailUser) {
			return fail(400, { fieldErrors: { email: 'signup_email_taken' as const } });
		}

		const userData: typeof users.$inferInsert = {
			username,
			email,
			passwordHash: await Bun.password.hash("test", { algorithm: 'bcrypt' }),
			firstName,
			lastName,
			gender,
			birthdate: new Date(birthdate),
			roles: [Role.User]
		};

		const systemUser = await User.getSystemUser();
		if (!systemUser) {
			return fail(500, { errorId: 'signup_server_error' as const });
		}

		const token = await systemUser.generateToken(TokenType.Verify, addDays(new Date(), 2), userData);
		const verificationLink = `https://${PUBLIC_ORIGIN}/confirm-email/?token=${token.getToken()}`;

		const mailSent = await sendMail({
			to: email, subject: 'Confirm your registration', text: verificationLink // TODO: Add HTML
		});

		if (!mailSent) {
			Logger.error('sendSignupMailFailed', { email, token: token.getToken() });
			return fail(501, { errorId: 'signup_server_error' as const });
		}*/

		return { success: true };
	}
};
