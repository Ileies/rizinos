import { pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';

export const minechatUsers = pgTable('minechat_users', {
	minecraftUuid: text('mc_uuid').notNull().unique(),
	discordUserId: text('dc_user_id').notNull().unique(),
	minecraftName: text('mc_name').notNull().unique(),
	token: text('token').unique()
});

export const minechatHooks = pgTable('minechat_hooks', {
	webhookId: text('webhook').notNull().unique(),
	channelId: text('channel').notNull().unique(),
	token: text('token').notNull().unique(),
	minecraftServerId: text('mc_server_id')
		.notNull()
		.unique()
		.references(() => minechatServers.serverId, { onDelete: 'cascade' }),
	prefix: text('prefix').notNull().default('<%1> ')
});

export const minechatServers = pgTable('minechat_servers', {
	serverId: text('server_id').notNull().unique(),
	ip: text('ip').notNull().unique()
});

export const minechatCredentials = pgTable('minechat_credentials', {
	serverId: text('server_id')
		.primaryKey()
		.references(() => minechatServers.serverId, { onDelete: 'cascade' }),
	secretHash: text('secret_hash').notNull()
});

export const minechatPairings = pgTable(
	'minechat_pairings',
	{
		tokenHash: text('token_hash').primaryKey(),
		kind: text('kind').$type<'server' | 'user'>().notNull(),
		subject: text('subject').notNull(),
		serverId: text('server_id')
			.notNull()
			.references(() => minechatServers.serverId, { onDelete: 'cascade' }),
		minecraftName: text('mc_name'),
		expires: timestamp('expires', { withTimezone: true }).notNull()
	},
	(table) => [unique().on(table.kind, table.subject)]
);
