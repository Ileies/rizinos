import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import packageJson from './package.json' with { type: 'json' };

const packageVersion = packageJson.version;

const packageVersionPlugin = {
	name: 'package-version',
	config() {
		return {
			define: {
				__APP_VERSION__: JSON.stringify(packageVersion)
			}
		};
	}
};

export default defineConfig({
	plugins: [
		packageVersionPlugin,
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
