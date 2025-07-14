import { drizzle } from 'drizzle-orm/bun-sql';
import * as pgSchema from '$db/schema';

export const db = drizzle('postgres://postgres@localhost/rizinos_test', { schema: pgSchema });