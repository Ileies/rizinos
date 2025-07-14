import { pgTable, text } from 'drizzle-orm/pg-core';
import { users } from './schemaUsers';
import { relations } from 'drizzle-orm';

export const dcUsers = pgTable('dc_users', {
	name: text('name').notNull().unique(),
	discordUserId: text('dc_user_id').notNull().unique(),
	userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' })
});
export const dcUsersRelations = relations(dcUsers, ({ one }) => ({
	user: one(users, {
		fields: [dcUsers.userId],
		references: [users.id]
	})
}));
