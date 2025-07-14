import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { id } from './lib';

import { LogLevel } from '$types';

export const logs = pgTable('logs', {
	id,
	type: text('type').notNull().$type<LogLevel>(),
	message: text('message').notNull(),
	createdAt: timestamp('timestamp').notNull().defaultNow(),
	data: jsonb('data')
});
