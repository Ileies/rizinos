import { doublePrecision, json, pgTable, serial, smallint, text, timestamp } from 'drizzle-orm/pg-core';
import { emptyTextArray, restrict } from './lib';
import { users } from './schemaUsers';
import { relations } from 'drizzle-orm';

export const mcUsers = pgTable('mc_users', {
	name: text('name').notNull().unique(),
	uuid: text('uuid').notNull().unique(),
	userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	permissions: text('permissions').array().notNull().default(emptyTextArray),
	homeLocation: text('home'),
	welcomeMessage: text('welcome'),
	bannedUntil: timestamp('banned'),
	bannedReason: text('banned_reason'),
	mutedUntil: timestamp('muted')
});
export const mcUsersRelations = relations(mcUsers, ({ one }) => ({
	user: one(users, {
		fields: [mcUsers.userId],
		references: [users.id]
	})
}));

export const mcWarps = pgTable('mc_warps', {
	name: text('name').notNull().unique(), restrict, location: text('location').notNull()
});

export const mcWorth = pgTable('mc_worth', {
	name: text('name').notNull().unique(), value: doublePrecision('value').notNull()
});

export const mcWorlds = pgTable('mc_worlds', {
	name: text('name').notNull().unique(),
	restrict,
	group: text('group').notNull().default('survival').references(() => mcWorldGroups.name, { onDelete: 'cascade' })
});
export const mcWorldsRelations = relations(mcWorlds, ({ one }) => ({
	group: one(mcWorldGroups, {
		fields: [mcWorlds.group],
		references: [mcWorldGroups.name]
	})
}));

export const mcWorldGroups = pgTable('mc_world_groups', {
	name: text('name').notNull().unique(), restrict, gameMode: smallint('game_mode').notNull().default(0)
});
export const mcWorldGroupsRelations = relations(mcWorldGroups, ({ many }) => ({
	worlds: many(mcWorlds)
}));

export const mcInventories = pgTable('mc_inventories', {
	id: serial('id').primaryKey(),
	ownerUuid: text('owner_uuid').notNull().references(() => mcUsers.uuid, { onDelete: 'cascade' }),
	worldGroup: text('world_group').notNull().references(() => mcWorldGroups.name, { onDelete: 'cascade' }),
	inventory: json('inventory').notNull()
});
export const mcInventoriesRelations = relations(mcInventories, ({ one }) => ({
	owner: one(mcUsers, {
		fields: [mcInventories.ownerUuid],
		references: [mcUsers.uuid]
	}),
	world: one(mcWorldGroups, {
		fields: [mcInventories.worldGroup],
		references: [mcWorldGroups.name]
	})
}));



