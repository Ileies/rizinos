import { sql } from 'drizzle-orm';
import { boolean, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { emptyTextArray, id } from './lib';
import { mcUsers } from './schemaMinecraft';
import { dcUsers } from './schemaDiscord';
import { Role, type UserID } from '$types/user';
import { TransactionStatus, TransactionType } from '$types/transaction';
import { TokenType } from '$types/token';

export const users = pgTable('users', {
	id: id.$type<UserID>(),
	username: text('username').notNull().unique(),
	email: text('email').notNull().unique(),
	firstName: text('first_name'),
	lastName: text('last_name'),
	passwordHash: text('password_hash').notNull(),
	roles: text('roles').array().notNull().$type<Role>().default(emptyTextArray),
	gender: text('gender').$type<'male' | 'female'>(),
	credit: integer('credit').notNull().default(0),
	birthdate: timestamp('birthdate').notNull(),
	lastOnline: timestamp('last_online').notNull().defaultNow(),
	isOnline: boolean('is_online').notNull().default(false),
	emailOptOut: boolean('email_opt_out').notNull().default(false),
	bannedUntil: timestamp('banned'),
	bannedReason: text('banned_reason'),
	banId: text('ban_id')
});

export const tokens = pgTable('tokens', {
	token: text('token').primaryKey(),
	userId: text('user_id')
		.references(() => users.id, { onDelete: 'cascade' })
		.$type<UserID>(),
	type: text('type').notNull().$type<TokenType>(),
	expires: timestamp('expires')
		.notNull()
		.$defaultFn(() => sql`CURRENT_TIMESTAMP + INTERVAL '1 month'`),
	data: jsonb('data')
});

export const devices = pgTable('devices', {
	deviceToken: text('device_token')
		.primaryKey()
		.references(() => tokens.token, { onDelete: 'cascade' }),
	sessionToken: text('session_token')
		.unique()
		.references(() => tokens.token, { onDelete: 'set null' }),
	userAgent: text('user_agent').notNull(),
	ip: text('ip').notNull(),
	countryCode: text('cc').notNull(),
	city: text('city').notNull(),
	timezone: text('timezone').notNull(),
	lastOnline: timestamp('last_online').notNull().defaultNow()
});

// TODO: Maybe transactions need tokens
export const transactions = pgTable('transactions', {
	id,
	senderId: text('sender_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' })
		.$type<UserID>(),
	receiverId: text('receiver_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' })
		.$type<UserID>(),
	amount: integer('amount').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	reason: text('reason').notNull(),
	type: text('type').notNull().$type<TransactionType>(),
	status: text('status').notNull().$type<TransactionStatus>().default(TransactionStatus.Completed)
});

export type usersInsertType = typeof users.$inferInsert;
