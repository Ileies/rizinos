import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	PUBLIC_ORIGIN: { public: true, static: true },
	PUBLIC_APP_NAME: { public: true, static: true },
	PUBLIC_VERSION: { public: true, static: true },
	DISCORD_LINK_SECRET: { static: true },
	DISCORD_CLIENT_ID: { static: true },
	DISCORD_CLIENT_SECRET: { static: true },
	GOOGLE_CLIENT_ID: { static: true },
	GOOGLE_CLIENT_SECRET: { static: true },
	DISCORD_BOT_SECRET: { static: true },
	DISCORD_BOT_URL: { static: true },
	SMTP_HOST: { static: true },
	SMTP_PASSWORD: { static: true },
	SMTP_USER: { static: true },
	STORAGE_DIRECTORY: { static: true }
});
