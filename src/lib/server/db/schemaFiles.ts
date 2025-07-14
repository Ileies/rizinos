import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { id } from './lib';
import { FileType, type ID } from '$types';

export const files = pgTable('file_meta', {
	id,
	name: text('name').notNull(),
	parentId: text('parent_id').notNull().$type<ID>(),
	type: text('type').notNull().$type<FileType>(),
	ownerId: text('owner_id').notNull(),
	groupId: text('group_id').notNull(),
	permissions: integer('permissions').notNull(),
	symlink_target: text('symlink_target'),
	created_at: timestamp('created_at').defaultNow(),
	updated_at: timestamp('updated_at').defaultNow()
});

