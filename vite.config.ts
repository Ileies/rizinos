import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			preprocess: vitePreprocess(),
			adapter: adapter(),
			alias: {
				$db: './src/lib/server/db',
				$types: './src/types',
				$ui: './src/lib/client/components',
				$shadcn: './src/lib/components'
			}
		}),
		devtoolsJson()
	],
	server: {
		proxy: {
			'/ws': {
				target: `http://localhost:${process.env.PORT ?? 3000}`,
				ws: true
			}
		}
	}
});
