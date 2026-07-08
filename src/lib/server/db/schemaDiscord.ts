import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './schemaUsers';

export const dcUsers = pgTable('dc_users', {
	name: text('name').notNull().unique(),
	discordUserId: text('dc_user_id').notNull().unique(),
	userId: text('user_id')
		.notNull()
		.unique()
		.references(() => users.id, { onDelete: 'cascade' }),
	bannedUntil: timestamp('banned'),
	bannedReason: text('banned_reason')
});
