import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	ORIGIN: { static: true },
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
