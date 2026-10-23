import { integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { id } from './lib';
import { users } from './schemaUsers';
import type { UserID } from '$types/user';
import type { ContactLocale, ContactStatus, ContactTopic } from '../contact/topics';

/** Messages sent through the public contact form. Deleted automatically once `expiresAt` passes. */
export const contactMessages = pgTable('contact_messages', {
	id,
	/** Human-friendly reference (e.g. RZ-7K3M9Q) shown to the sender and in every mail. */
	ref: text('ref').notNull().unique(),
	topic: text('topic').notNull().$type<ContactTopic>(),
	status: text('status').notNull().$type<ContactStatus>().default('new'),
	name: text('name').notNull(),
	email: text('email').notNull(),
	subject: text('subject').notNull(),
	message: text('message').notNull(),
	locale: text('locale').notNull().$type<ContactLocale>().default('en'),
	/** Set when the sender was signed in. The account email overrides what the form sent. */
	userId: text('user_id')
		.references(() => users.id, { onDelete: 'set null' })
		.$type<UserID>(),
	/** Topic-specific extra fields (see TOPIC_DETAILS). */
	details: jsonb('details').notNull().$type<Record<string, string>>().default({}),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
	resolvedAt: timestamp('resolved_at'),
	expiresAt: timestamp('expires_at').notNull()
});

/** Staff replies sent by email from the admin dashboard. */
export const contactReplies = pgTable('contact_replies', {
	id,
	messageId: text('message_id')
		.notNull()
		.references(() => contactMessages.id, { onDelete: 'cascade' }),
	authorId: text('author_id')
		.references(() => users.id, { onDelete: 'set null' })
		.$type<UserID>(),
	body: text('body').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

/** Screenshots sent with a message. The bytes live on disk (see contact/storage.ts). */
export const contactAttachments = pgTable('contact_attachments', {
	id,
	messageId: text('message_id')
		.notNull()
		.references(() => contactMessages.id, { onDelete: 'cascade' }),
	filename: text('filename').notNull(),
	mimeType: text('mime_type').notNull(),
	size: integer('size').notNull(),
	/** File name below the contact storage directory. Never user-controlled. */
	storageKey: text('storage_key').notNull().unique(),
	createdAt: timestamp('created_at').notNull().defaultNow()
});
