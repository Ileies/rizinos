import { eq, inArray, lt } from 'drizzle-orm';
import { db } from '$db';
import { contactAttachments, contactMessages } from '$db/schema';
import Logger from '#lib/server/models/Logger.js';
import { deleteAttachment } from './storage';

/** Deletes one message together with its attachment files. Replies and attachment rows cascade. */
export async function deleteContactMessage(messageId: string): Promise<void> {
	const files = await db
		.select({ storageKey: contactAttachments.storageKey })
		.from(contactAttachments)
		.where(eq(contactAttachments.messageId, messageId));
	await db.delete(contactMessages).where(eq(contactMessages.id, messageId));
	await Promise.all(files.map((f) => deleteAttachment(f.storageKey)));
}

/** Removes every message past its retention date. Returns how many were deleted. */
export async function purgeExpiredContact(): Promise<number> {
	const expired = await db
		.select({ id: contactMessages.id })
		.from(contactMessages)
		.where(lt(contactMessages.expiresAt, new Date()));
	if (!expired.length) return 0;

	const ids = expired.map((m) => m.id);
	const files = await db
		.select({ storageKey: contactAttachments.storageKey })
		.from(contactAttachments)
		.where(inArray(contactAttachments.messageId, ids));
	await db.delete(contactMessages).where(inArray(contactMessages.id, ids));
	await Promise.all(files.map((f) => deleteAttachment(f.storageKey)));
	return ids.length;
}

const SIX_HOURS = 6 * 60 * 60 * 1000;

/** Runs the purge shortly after startup and then every six hours. Safe to call once per process. */
export function startContactRetention(): void {
	const run = () =>
		purgeExpiredContact()
			.then((n) => n && Logger.info(`Contact retention: deleted ${n} expired message(s).`))
			.catch((e) => Logger.error('Contact retention failed.', e));
	setTimeout(run, 60_000).unref?.();
	setInterval(run, SIX_HOURS).unref?.();
}
