/**
 * Single source of truth for the contact form on the backend: topics, routing, per-topic detail
 * fields and limits. The static frontend mirrors this in `rizinos-web/src/lib/contact.ts`.
 * Keep both in sync when adding a topic or field.
 *
 * Pure module (no `$app` imports) so it can be unit-tested with `bun test`.
 */

export const CONTACT_TOPICS = [
	'general',
	'account',
	'bug',
	'feedback',
	'security',
	'press',
	'legal'
] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export const CONTACT_LOCALES = ['de', 'en', 'cn', 'ru'] as const;
export type ContactLocale = (typeof CONTACT_LOCALES)[number];

export const CONTACT_STATUSES = ['new', 'open', 'resolved', 'spam'] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

/** Mailboxes that exist on the mail server. Messages are forwarded to `<mailbox>@<origin>`. */
export type Mailbox = 'support' | 'security' | 'press' | 'privacy';

export const TOPIC_MAILBOX: Record<ContactTopic, Mailbox> = {
	general: 'support',
	account: 'support',
	bug: 'support',
	feedback: 'support',
	security: 'security',
	press: 'press',
	legal: 'privacy'
};

export const TOPIC_LABEL: Record<ContactTopic, string> = {
	general: 'General question',
	account: 'Account or login help',
	bug: 'Bug report',
	feedback: 'Feature request or feedback',
	security: 'Security disclosure',
	press: 'Press, partnership or business',
	legal: 'Abuse, legal or privacy request'
};

export const LIMITS = {
	name: 80,
	email: 254,
	subject: 150,
	message: 5000,
	minMessage: 10,
	attachments: 3,
	attachmentBytes: 5 * 1024 * 1024,
	reply: 5000
} as const;

/** Retention of contact messages in months. Shown to users in the form's privacy notice. */
export const RETENTION_MONTHS = 12;

export interface DetailField {
	key: string;
	max: number;
	/** If set, the value must be one of these. */
	options?: readonly string[];
}

export const TOPIC_DETAILS: Record<ContactTopic, readonly DetailField[]> = {
	general: [],
	account: [
		{
			key: 'problem',
			max: 40,
			options: ['login', 'password_reset', 'email_confirm', 'delete_account', 'other']
		},
		{ key: 'username', max: 40 }
	],
	bug: [
		{
			key: 'area',
			max: 40,
			options: [
				'desktop',
				'apps',
				'files',
				'terminal',
				'account',
				'website',
				'minecraft',
				'discord',
				'other'
			]
		},
		{ key: 'steps', max: 2000 },
		{ key: 'expected', max: 1000 },
		{ key: 'environment', max: 600 }
	],
	feedback: [{ key: 'kind', max: 40, options: ['feature', 'improvement', 'praise', 'other'] }],
	security: [
		{ key: 'severity', max: 40, options: ['unknown', 'low', 'medium', 'high', 'critical'] },
		{ key: 'affected', max: 300 }
	],
	press: [
		{ key: 'outlet', max: 120 },
		{ key: 'deadline', max: 40 }
	],
	legal: [
		{ key: 'kind', max: 40, options: ['privacy_request', 'dmca', 'abuse', 'other'] },
		{ key: 'reference', max: 500 }
	]
};

export function isContactTopic(value: unknown): value is ContactTopic {
	return typeof value === 'string' && (CONTACT_TOPICS as readonly string[]).includes(value);
}

export function isContactLocale(value: unknown): value is ContactLocale {
	return typeof value === 'string' && (CONTACT_LOCALES as readonly string[]).includes(value);
}

export function isContactStatus(value: unknown): value is ContactStatus {
	return typeof value === 'string' && (CONTACT_STATUSES as readonly string[]).includes(value);
}
