import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		// Distinct asset dir so the os's client assets don't collide with the
		// static frontend's default `/_app/` when both are served from the same origin.
		appDir: '_os',
		alias: {
			$db: './src/lib/server/db',
			$types: './src/types',
			$ui: './src/lib/client/components',
			$shadcn: './src/lib/components'
		}
	}
};

export default config;
