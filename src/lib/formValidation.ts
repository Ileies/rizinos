import { z } from 'zod';

const yearsAgo = (years: number): number => {
	const date = new Date();
	date.setFullYear(date.getFullYear() - years);
	return date.getTime();
};

export const minAge = yearsAgo(13);
export const maxAge = yearsAgo(120);

export const formSchema = z.object({
	username: z
		.string()
		.min(3, 'Username must be at least 3 characters')
		.max(20, 'Username must be 20 characters or less')
		.regex(
			/^[a-zA-Z0-9_-]+$/,
			'Username may only contain letters, numbers, underscores and dashes'
		),
	birthdate: z.iso.date('Must be in YYYY-MM-DD format').refine((date) => {
		const dateTime = new Date(date).getTime();
		return !(dateTime < maxAge || dateTime > minAge);
	}, 'You must be at least 13 years old'),
	email: z.email('Invalid email address'),
	password: z.string().min(8, 'Password must be at least 8 characters')
});

export type FormData = z.infer<typeof formSchema>;
