import { json, type RequestHandler } from '@sveltejs/kit';
import { DISCORD_LINK_SECRET } from '$env/static/private';

/** Vom Discord-Bot aufgerufen (KI-Tool "search_knowledge"). Aktuell nur ein Mock zum Testen der Anbindung. */
export const POST: RequestHandler = async ({ request }) => {
	if (request.headers.get('x-discord-bot-secret') !== DISCORD_LINK_SECRET) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	const { query } = (await request.json()) as { query?: string };
	if (!query) return json({ message: 'query required' }, { status: 400 });

	return json({
		results: [
			{
				source: 'docs',
				title: 'Mock-Ergebnis',
				content: `Dies ist ein Platzhalter-Ergebnis für die Anfrage "${query}". Der echte Knowledge-Endpunkt (Docs/Logs/Vector-Store) ist noch nicht implementiert.`
			}
		]
	});
};
