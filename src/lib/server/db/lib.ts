import { sql } from 'drizzle-orm';
import { customType, text } from 'drizzle-orm/pg-core';
import snowflake from '../models/Snowflake';
import type { Restrict } from '$types';

export const id = text('id').primaryKey().$defaultFn(() => snowflake.nextId());
export const restrict = text('restrict').array().notNull().$type<Restrict[]>().default(sql`ARRAY['@beta']::text[]`);
export const emptyTextArray = sql`ARRAY[]::text[]`;
export const ltree = customType<{ data: string }>({
	dataType() {
		return 'ltree';
	}
});
