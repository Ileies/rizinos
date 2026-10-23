import { PUBLIC_ORIGIN } from '$app/env/public';
import { sendEmail, type EmailBlock } from '#lib/server/email.js';
import { AUTO_REPLY } from './mailCopy';
import {
	LIMITS,
	TOPIC_LABEL,
	TOPIC_MAILBOX,
	type ContactLocale,
	type ContactTopic
} from './topics';

interface MessageForMail {
	ref: string;
	topic: ContactTopic;
	name: string;
	email: string;
	subject: string;
	message: string;
	locale: ContactLocale;
	details: Record<string, string>;
}

const DETAIL_LABEL: Record<string, string> = {
	problem: 'Problem',
	username: 'Username given',
	area: 'Area',
	steps: 'Steps to reproduce',
	expected: 'Expected behaviour',
	environment: 'Environment',
	kind: 'Kind',
	severity: 'Severity',
	affected: 'Affected',
	outlet: 'Outlet',
	deadline: 'Deadline',
	reference: 'Reference link'
};

/** Internal notification to the responsible mailbox. Reply-To is the sender, so staff can answer directly. */
export async function sendTeamNotification(
	msg: MessageForMail,
	extra: { username: string | null; attachments: number }
): Promise<string | null> {
	const mailbox = `${TOPIC_MAILBOX[msg.topic]}@${PUBLIC_ORIGIN}`;
	const blocks: EmailBlock[] = [
		{
			type: 'keyvalue',
			rows: [
				{ label: 'Reference', value: msg.ref },
				{ label: 'Topic', value: TOPIC_LABEL[msg.topic] },
				{ label: 'From', value: `${msg.name} <${msg.email}>` },
				{ label: 'Account', value: extra.username ?? 'Not signed in' },
				{ label: 'Language', value: msg.locale },
				{ label: 'Attachments', value: String(extra.attachments) },
				...Object.entries(msg.details).map(([key, value]) => ({
					label: DETAIL_LABEL[key] ?? key,
					value
				}))
			]
		},
		{ type: 'text', content: msg.message }
	];
	if (extra.attachments > 0) {
		blocks.push({
			type: 'alert',
			level: 'info',
			content: 'Screenshots are attached to this message in the admin dashboard.'
		});
	}

	return sendEmail({
		to: mailbox,
		subject: `[${msg.ref}] ${msg.subject}`.slice(0, LIMITS.subject + 20),
		category: 'transactional',
		preheader: msg.message.slice(0, 90),
		replyTo: msg.email,
		blocks,
		cta: { label: 'Open in admin', url: `https://${PUBLIC_ORIGIN}/admin` }
	});
}

/** Localised confirmation for the sender, including a copy of what they wrote. */
export async function sendAutoReply(msg: MessageForMail): Promise<string | null> {
	const copy = AUTO_REPLY[msg.locale];
	return sendEmail({
		to: msg.email,
		subject: copy.subject(msg.ref),
		category: 'support',
		preheader: copy.preheader,
		greeting: copy.greeting(msg.name),
		blocks: [
			{ type: 'text', content: copy.intro },
			{
				type: 'keyvalue',
				rows: [
					{ label: copy.reference, value: msg.ref },
					{ label: copy.topic, value: copy.topics[msg.topic] },
					{ label: copy.subjectLabel, value: msg.subject }
				]
			},
			{ type: 'text', content: `${copy.yourMessage}:\n\n${msg.message}` },
			{ type: 'divider' },
			{ type: 'text', content: copy.note }
		]
	});
}

/** A staff reply sent from the admin dashboard. The reference stays in the subject so threads can be matched. */
export async function sendStaffReply(
	msg: Pick<MessageForMail, 'ref' | 'name' | 'email' | 'subject' | 'locale'>,
	body: string
): Promise<string | null> {
	return sendEmail({
		to: msg.email,
		subject: `Re: ${msg.subject} [${msg.ref}]`,
		category: 'support',
		preheader: body.slice(0, 90),
		greeting: AUTO_REPLY[msg.locale].greeting(msg.name),
		blocks: [{ type: 'text', content: body }]
	});
}
