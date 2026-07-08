import { pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './schemaUsers';
import type { UserID } from '$types/user';
import type { OAuthProvider } from '$types/oauth';

export const oauthAccounts = pgTable(
	'oauth_accounts',
	{
		provider: text('provider').notNull().$type<OAuthProvider>(),
		providerId: text('provider_id').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' })
			.$type<UserID>(),
		createdAt: timestamp('created_at').notNull().defaultNow()
	},
	(t) => [primaryKey({ columns: [t.provider, t.providerId] })]
);
