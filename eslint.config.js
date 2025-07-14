import prettier from 'eslint-config-prettier';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default ts.config(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	//...ts.configs.strictTypeChecked, // Remove this if it becomes unbearable
	//...ts.configs.stylisticTypeChecked, // This is new for more type safety
	prettier,
	...svelte.configs.prettier,
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		},
		rules: {
			'no-undef': 'off'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			}
		}
	}
);
/*{
		rules: { // This is new for more type safety
			'no-unused-vars': 'off', // TypeScript handles this
			'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/restrict-template-expressions': 'off',
			'svelte/valid-compile': 'error',
			'svelte/no-at-html-tags': 'error',
			'svelte/no-dupe-else-if-blocks': 'error',
			'svelte/no-dupe-style-properties': 'error',
			'svelte/no-spaces-around-equal-signs-in-attribute': 'error',
			'svelte/no-unknown-style-directive-property': 'error'
		}
	}*/
