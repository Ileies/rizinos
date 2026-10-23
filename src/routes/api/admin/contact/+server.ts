import { json, type RequestHandler } from '@sveltejs/kit';
import { and, count, desc, eq, ilike, inArray, or, type SQL } from 'drizzle-orm';
import { db } from '$db';
import { contactAttachments, contactMessages, contactReplies, users } from '$db/schema';
import { Role } from '$types';
import { hasRole } from '#lib/server/models/User.js';
import Logger from '#lib/server/models/Logger.js';
import { parsePage } from '#lib/server/adminQuery.js';
import { deleteContactMessage } from '#lib/server/contact/retention.js';
import { sendStaffReply } from '#lib/server/contact/mail.js';
import { isContactStatus, isContactTopic, LIMITS } from '#lib/server/contact/topics.js';

function isAdmin(locals: App.Locals) {
	return !!locals.user && hasRole(locals.user, Role.Admin);
}

const forbidden = () => json({ message: 'Forbidden' }, { status: 403 });

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!isAdmin(locals)) return forbidden();

	const id = url.searchParams.get('id');
	if (id) {
		const detail = await loadDetail(id);
		return detail ? json(detail) : json({ message: 'Message not found' }, { status: 404 });
	}

	const status = url.searchParams.get('status') ?? 'active';
	const topic = url.searchParams.get('topic');
	const search = url.searchParams.get('q')?.trim();
	const { limit, offset } = parsePage(url, 'contact');

	const filters: SQL[] = [];
	if (status === 'active') filters.push(inArray(contactMessages.status, ['new', 'open']));
	else if (isContactStatus(status)) filters.push(eq(contactMessages.status, status));
	if (isContactTopic(topic)) filters.push(eq(contactMessages.topic, topic));
	if (search) {
		const like = `%${search}%`;
		filters.push(
			or(
				ilike(contactMessages.ref, like),
				ilike(contactMessages.name, like),
				ilike(contactMessages.email, like),
				ilike(contactMessages.subject, like),
				ilike(contactMessages.message, like)
			)!
		);
	}
	const where = filters.length ? and(...filters) : undefined;

	const [rows, [{ value: total }], statusCounts] = await Promise.all([
		db
			.select()
			.from(contactMessages)
			.where(where)
			.orderBy(desc(contactMessages.createdAt))
			.limit(limit)
			.offset(offset),
		db.select({ value: count() }).from(contactMessages).where(where),
		db
			.select({ status: contactMessages.status, value: count() })
			.from(contactMessages)
			.groupBy(contactMessages.status)
	]);

	const attachmentCounts = rows.length
		? await db
				.select({ messageId: contactAttachments.messageId, value: count() })
				.from(contactAttachments)
				.where(
					inArray(
						contactAttachments.messageId,
						rows.map((r) => r.id)
					)
				)
				.groupBy(contactAttachments.messageId)
		: [];
	const attachmentsBy = new Map(attachmentCounts.map((a) => [a.messageId, a.value]));

	const counts = { new: 0, open: 0, resolved: 0, spam: 0 };
	for (const row of statusCounts) counts[row.status] = row.value;

	return json({
		messages: rows.map((m) => ({
			id: m.id,
			ref: m.ref,
			topic: m.topic,
			status: m.status,
			name: m.name,
			email: m.email,
			subject: m.subject,
			preview: m.message.slice(0, 160),
			signedIn: !!m.userId,
			attachments: attachmentsBy.get(m.id) ?? 0,
			createdAt: m.createdAt
		})),
		total,
		counts
	});
};

async function loadDetail(id: string) {
	const message = await db.query.contactMessages.findFirst({ where: { id } });
	if (!message) return null;

	const [replies, attachments, account] = await Promise.all([
		db
			.select({
				id: contactReplies.id,
				body: contactReplies.body,
				createdAt: contactReplies.createdAt,
				author: users.username
			})
			.from(contactReplies)
			.leftJoin(users, eq(users.id, contactReplies.authorId))
			.where(eq(contactReplies.messageId, id))
			.orderBy(contactReplies.createdAt),
		db
			.select({
				id: contactAttachments.id,
				filename: contactAttachments.filename,
				mimeType: contactAttachments.mimeType,
				size: contactAttachments.size
			})
			.from(contactAttachments)
			.where(eq(contactAttachments.messageId, id)),
		message.userId
			? db
					.select({ id: users.id, username: users.username, email: users.email })
					.from(users)
					.where(eq(users.id, message.userId))
					.then((r) => r[0] ?? null)
			: null
	]);

	return { message, replies, attachments, account };
}

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!isAdmin(locals)) return forbidden();

	const { action, ...data } = (await request.json()) as Record<string, string> & { action: string };
	const id = data.id;
	if (!id) return json({ message: 'ID required' }, { status: 400 });

	const message = await db.query.contactMessages.findFirst({ where: { id } });
	if (!message) return json({ message: 'Message not found' }, { status: 404 });

	switch (action) {
		case 'status': {
			if (!isContactStatus(data.status)) {
				return json({ message: 'Invalid status' }, { status: 400 });
			}
			await db
				.update(contactMessages)
				.set({
					status: data.status,
					updatedAt: new Date(),
					resolvedAt: data.status === 'resolved' ? new Date() : null
				})
				.where(eq(contactMessages.id, id));
			return json({ success: true });
		}

		case 'reply': {
			const body = data.body?.replace(/\r\n?/g, '\n').trim();
			if (!body) return json({ message: 'Reply text required' }, { status: 400 });
			if (body.length > LIMITS.reply) return json({ message: 'Reply too long' }, { status: 400 });

			let sent: string | null = null;
			try {
				sent = await sendStaffReply(message, body);
			} catch (e) {
				Logger.error(`Contact reply mail failed (${message.ref}).`, e);
			}
			if (!sent) return json({ message: 'The email could not be sent' }, { status: 502 });

			await db.insert(contactReplies).values({ messageId: id, authorId: locals.user!.id, body });
			await db
				.update(contactMessages)
				.set({ status: message.status === 'new' ? 'open' : message.status, updatedAt: new Date() })
				.where(eq(contactMessages.id, id));
			return json({ success: true });
		}

		case 'delete': {
			await deleteContactMessage(id);
			return json({ success: true });
		}

		default:
			return json({ message: 'Unknown action' }, { status: 400 });
	}
};
