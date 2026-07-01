import { bigint, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { id } from './lib';
import { FileType } from '$types';

export const blobs = pgTable('file_blobs', {
	hash: text('hash').primaryKey(), // BLAKE3 hex
	size: bigint('size', { mode: 'number' }).notNull(),
	mimeType: text('mime_type').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

// path = parent directory's listing path (e.g. "/" for root items, "/abc/xyz/" for nested)
// a directory D's listing path (= children's path) = D.path + D.id + "/"
export const files = pgTable('file_meta', {
	id,
	name: text('name').notNull(),
	path: text('path').notNull().default('/'),
	type: text('type').notNull().$type<FileType>(),
	ownerId: text('owner_id').notNull(),
	groupId: text('group_id').notNull().default('users'),
	permissions: integer('permissions').notNull().default(644),
	blobHash: text('blob_hash').references(() => blobs.hash, { onDelete: 'restrict' }),
	size: bigint('size', { mode: 'number' }),
	mimeType: text('mime_type'),
	symlinkTarget: text('symlink_target'), // file_meta.id of target
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});
