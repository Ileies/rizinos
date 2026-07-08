import { json, type RequestHandler } from '@sveltejs/kit';
import { DISCORD_LINK_SECRET } from '$env/static/private';
import { db } from '$db';

/** Vom Discord-Bot aufgerufen, um zu prüfen ob ein Discord-Account bereits verknüpft ist. */
export const GET: RequestHandler = async ({ request, url }) => {
	if (request.headers.get('x-discord-bot-secret') !== DISCORD_LINK_SECRET) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	const discordUserId = url.searchParams.get('discordUserId');
	if (!discordUserId) return json({ message: 'discordUserId required' }, { status: 400 });

	const existing = await db.query.dcUsers.findFirst({ where: { discordUserId } });
	return json({ linked: !!existing });
};
