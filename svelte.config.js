import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		alias: {
			$db: './src/lib/server/db',
			$types: './src/types',
			$ui: './src/lib/client/components'
		}
	}
};

export default config;
