import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	dialect: 'postgresql',
	dbCredentials: {
		url: 'postgres://postgres@localhost/rizinos_test'
	},
	verbose: true,
	strict: true
});
