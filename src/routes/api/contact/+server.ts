import { json, type RequestHandler } from '@sveltejs/kit';
import { addMonths } from 'date-fns';
import { db } from '$db';
import { contactAttachments, contactMessages } from '$db/schema';
import Logger from '#lib/server/models/Logger.js';
import { notifyContact } from '#lib/server/discordBot.js';
import { checkAttachments, extensionFor } from '#lib/server/contact/attachments.js';
import { clientIp, takeSubmission, verifyChallenge } from '#lib/server/contact/guard.js';
import { sendAutoReply, sendTeamNotification } from '#lib/server/contact/mail.js';
import { generateRef } from '#lib/server/contact/ref.js';
import { deleteAttachment, writeAttachment } from '#lib/server/contact/storage.js';
import { LIMITS, RETENTION_MONTHS } from '#lib/server/contact/topics.js';
import { validateContact } from '#lib/server/contact/validate.js';
import snowflake from '#lib/server/models/Snowflake.js';

const MAX_REQUEST_BYTES = LIMITS.attachments * LIMITS.attachmentBytes + 256 * 1024;

const fail = (
	status: number,
	error: string,
	extra: Record<string, unknown> = {},
	headers?: HeadersInit
) => json({ error, ...extra }, { status, headers });

async function readBody(request: Request): Promise<{ payload: unknown; files: File[] } | null> {
	const type = request.headers.get('content-type') ?? '';
	try {
		if (type.includes('multipart/form-data')) {
			const form = await request.formData();
			const rawPayload = form.get('payload');
			if (typeof rawPayload !== 'string') return null;
			const files = form.getAll('attachments').filter((v): v is File => v instanceof File);
			return { payload: JSON.parse(rawPayload), files };
		}
		if (type.includes('application/json')) return { payload: await request.json(), files: [] };
	} catch {
		return null;
	}
	return null;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const length = Number(request.headers.get('content-length'));
	if (Number.isFinite(length) && length > MAX_REQUEST_BYTES) return fail(413, 'payload_too_large');

	const body = await readBody(request);
	if (!body) return fail(400, 'invalid_payload');
	const raw = (body.payload && typeof body.payload === 'object' ? body.payload : {}) as Record<
		string,
		unknown
	>;

	// Honeypot: real users never see this field. Pretend it worked so bots do not adapt.
	if (typeof raw.website === 'string' && raw.website.trim() !== '') {
		return json({ ok: true, ref: generateRef() });
	}

	const challenge = await verifyChallenge(raw.challenge);
	if (challenge !== 'ok') return fail(400, `challenge_${challenge}`);

	// A signed-in sender cannot be impersonated: name and email always come from the account.
	const user = locals.user;
	const validated = validateContact({
		...raw,
		...(user
			? {
					email: user.email,
					name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username
				}
			: {})
	});
	if (!validated.ok) return fail(422, 'validation', { issues: validated.issues });
	const input = validated.value;

	const attachments = await checkAttachments(body.files);
	if (!attachments.ok) {
		return fail(422, 'attachment', { issue: attachments.issue, index: attachments.index });
	}

	const ip = clientIp(request.headers.get('x-forwarded-for'), locals.ip);
	const limit = takeSubmission(ip, input.email);
	if (!limit.ok) {
		return fail(
			429,
			'rate_limited',
			{ retryAfter: limit.retryAfter },
			{ 'Retry-After': String(limit.retryAfter) }
		);
	}

	const stored = attachments.files.map((file) => ({
		...file,
		storageKey: `${snowflake.nextId()}.${extensionFor(file.mimeType)}`
	}));

	let ref = '';
	try {
		await Promise.all(stored.map((f) => writeAttachment(f.storageKey, f.bytes)));

		// `ref` is unique; on the (unlikely) collision, draw a new one a few times.
		for (let attempt = 0; ; attempt++) {
			ref = generateRef();
			try {
				await db.transaction(async (tx) => {
					const [row] = await tx
						.insert(contactMessages)
						.values({
							ref,
							topic: input.topic,
							name: input.name,
							email: input.email,
							subject: input.subject,
							message: input.message,
							locale: input.locale,
							userId: user?.id ?? null,
							details: input.details,
							expiresAt: addMonths(new Date(), RETENTION_MONTHS)
						})
						.returning({ id: contactMessages.id });
					if (stored.length) {
						await tx.insert(contactAttachments).values(
							stored.map((f) => ({
								messageId: row.id,
								filename: f.filename,
								mimeType: f.mimeType,
								size: f.size,
								storageKey: f.storageKey
							}))
						);
					}
				});
				break;
			} catch (e) {
				const duplicateRef = String((e as { message?: string })?.message).includes(
					'contact_messages_ref'
				);
				if (!duplicateRef || attempt >= 4) throw e;
			}
		}
	} catch (e) {
		await Promise.all(stored.map((f) => deleteAttachment(f.storageKey)));
		Logger.error('Contact message could not be stored.', e);
		return fail(500, 'server_error');
	}

	// Mail and Discord are best effort: the message is already safely stored.
	const mailData = { ref, ...input };
	void Promise.allSettled([
		sendTeamNotification(mailData, {
			username: user?.username ?? null,
			attachments: stored.length
		}),
		sendAutoReply(mailData),
		notifyContact({
			ref,
			topic: input.topic,
			subject: input.subject,
			preview: input.message.slice(0, 300),
			attachments: stored.length,
			signedIn: !!user
		})
	]).then((results) => {
		results.forEach((r, i) => {
			if (r.status === 'rejected') {
				Logger.warn(
					`Contact ${['team mail', 'auto-reply', 'Discord notice'][i]} failed (${ref}).`,
					r.reason
				);
			}
		});
	});

	return json({ ok: true, ref });
};
