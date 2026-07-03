import { defineConfig } from 'drizzle-kit';

const prod = process.env.NODE_ENV === 'production';

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	dialect: 'postgresql',
	dbCredentials: {
		url: `postgres://postgres@localhost/rizinos${prod ? '' : '_test'}`
	},
	verbose: true,
	strict: true
});
