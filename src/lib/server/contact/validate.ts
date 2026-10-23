import {
	LIMITS,
	TOPIC_DETAILS,
	isContactLocale,
	isContactTopic,
	type ContactLocale,
	type ContactTopic
} from './topics';

export type ValidationCode =
	'required' | 'too_short' | 'too_long' | 'invalid_email' | 'invalid_option';

export interface ValidationIssue {
	field: string;
	code: ValidationCode;
}

export interface ContactInput {
	topic: ContactTopic;
	name: string;
	email: string;
	subject: string;
	message: string;
	locale: ContactLocale;
	details: Record<string, string>;
}

export type ValidationResult =
	{ ok: true; value: ContactInput } | { ok: false; issues: ValidationIssue[] };

// Deliberately simple: a full RFC 5322 check is not worth it, the auto-reply bounces for bad ones.
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

/** Control characters (except tab and newline), zero-width characters and bidi overrides. */
function isStripped(code: number): boolean {
	return (
		code <= 0x08 ||
		code === 0x0b ||
		code === 0x0c ||
		(code >= 0x0e && code <= 0x1f) ||
		code === 0x7f ||
		(code >= 0x200b && code <= 0x200f) ||
		(code >= 0x202a && code <= 0x202e) ||
		(code >= 0x2066 && code <= 0x2069)
	);
}

/** Strips unwanted invisible characters, normalises line endings and trims. */
export function clean(value: unknown): string {
	if (typeof value !== 'string') return '';
	return Array.from(value.replace(/\r\n?/g, '\n'))
		.filter((char) => !isStripped(char.codePointAt(0)!))
		.join('')
		.trim();
}

/** Single-line fields must never contain newlines (they end up in mail headers and subjects). */
function oneLine(value: unknown): string {
	return clean(value).replace(/\s*\n\s*/g, ' ');
}

export function validateContact(raw: unknown): ValidationResult {
	const issues: ValidationIssue[] = [];
	const body = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;

	if (!isContactTopic(body.topic)) {
		return { ok: false, issues: [{ field: 'topic', code: 'invalid_option' }] };
	}
	const topic = body.topic;

	const name = oneLine(body.name);
	if (!name) issues.push({ field: 'name', code: 'required' });
	else if (name.length > LIMITS.name) issues.push({ field: 'name', code: 'too_long' });

	const email = oneLine(body.email).toLowerCase();
	if (!email) issues.push({ field: 'email', code: 'required' });
	else if (email.length > LIMITS.email || !EMAIL_RE.test(email))
		issues.push({ field: 'email', code: 'invalid_email' });

	const subject = oneLine(body.subject);
	if (!subject) issues.push({ field: 'subject', code: 'required' });
	else if (subject.length > LIMITS.subject) issues.push({ field: 'subject', code: 'too_long' });

	const message = clean(body.message);
	if (!message) issues.push({ field: 'message', code: 'required' });
	else if (message.length < LIMITS.minMessage) issues.push({ field: 'message', code: 'too_short' });
	else if (message.length > LIMITS.message) issues.push({ field: 'message', code: 'too_long' });

	const details: Record<string, string> = {};
	const rawDetails = (
		body.details && typeof body.details === 'object' ? body.details : {}
	) as Record<string, unknown>;
	for (const field of TOPIC_DETAILS[topic]) {
		const value = field.max > 100 ? clean(rawDetails[field.key]) : oneLine(rawDetails[field.key]);
		if (!value) continue;
		if (value.length > field.max) issues.push({ field: field.key, code: 'too_long' });
		else if (field.options && !field.options.includes(value))
			issues.push({ field: field.key, code: 'invalid_option' });
		else details[field.key] = value;
	}

	if (issues.length) return { ok: false, issues };

	return {
		ok: true,
		value: {
			topic,
			name,
			email,
			subject,
			message,
			locale: isContactLocale(body.locale) ? body.locale : 'en',
			details
		}
	};
}
