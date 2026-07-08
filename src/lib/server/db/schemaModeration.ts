import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import type { BanType } from '$types/moderation';

/**
 * subjectId hält je nach type die mcUsers.uuid, dcUsers.discordUserId oder users.id -
 * kein FK möglich, da das Ziel je Ban-Typ eine andere Tabelle ist.
 */
export const unbanRequests = pgTable('unban_requests', {
	id: serial('id').primaryKey(),
	type: text('type').notNull().$type<BanType>(),
	subjectId: text('subject_id').notNull(),
	label: text('label').notNull(),
	message: text('message').notNull(),
	status: text('status').notNull().default('pending'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	resolvedAt: timestamp('resolved_at')
});
