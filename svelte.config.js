import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		csrf: {
			checkOrigin: false // TODO: Fix this - disabling origin check is a security risk. Investigate why origin validation was failing and re-enable after fixing.
		},
		alias: {
			$db: './src/lib/server/db',
			$types: './src/types',
			$ui: './src/lib/client/components'
		}
	}
};

export default config;
