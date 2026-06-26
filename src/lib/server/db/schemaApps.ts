import { pgTable, text } from 'drizzle-orm/pg-core';
import { id, restrict } from './lib';
import { users } from './schemaUsers';

export const apps = pgTable('apps', {
	id,
	name: text('name').notNull().unique(),
	restrict,
	title: text('title').notNull(),
	authorId: text('author_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' })
});
