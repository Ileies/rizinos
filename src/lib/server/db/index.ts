import { drizzle } from 'drizzle-orm/bun-sql';
import * as pgSchema from '$db/schema';
import { relations } from '$db/relations';

export const db = drizzle({
	connection: { hostname: 'localhost', username: 'postgres', database: 'rizinos_test' },
	schema: pgSchema,
	relations
});
