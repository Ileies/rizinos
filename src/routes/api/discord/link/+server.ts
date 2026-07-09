import { json, type RequestHandler } from '@sveltejs/kit';
import { addMinutes } from 'date-fns';
import { DISCORD_LINK_SECRET } from '$env/static/private';
import { PUBLIC_ORIGIN } from '$env/static/public';
import { db } from '$db';
import { dcUsers } from '$db/schema';
import { generateToken } from '$lib/server/models/User';
import { getToken, revokeToken, tokenIsExpired } from '$lib/server/models/token';
import { TokenType } from '$types';
import { notifyLinkSuccess } from '$lib/server/discordBot';

/** Vom Discord-Bot aufgerufen, um einen Verknüpfungs-Token für eine `/link`-Anfrage zu erzeugen. */
export const POST: RequestHandler = async ({ request }) => {
	if (request.headers.get('x-discord-bot-secret') !== DISCORD_LINK_SECRET) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	const { discordUserId } = (await request.json()) as { discordUserId?: string };
	if (!discordUserId) return json({ message: 'discordUserId required' }, { status: 400 });

	const existing = await db.query.dcUsers.findFirst({ where: { discordUserId } });
	if (existing) return json({ message: 'already_linked' }, { status: 409 });

	const token = await generateToken(null, TokenType.Discord, addMinutes(new Date(), 15), {
		discordUserId
	});

	return json({ token: token.token, url: `https://${PUBLIC_ORIGIN}/link/?token=${token.token}` });
};

/** Vom eingeloggten User via rizinos-web aufgerufen, um die Verknüpfung mit einem Token zu bestätigen. */
export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) return json({ status: 1 }); // not authenticated

	const tokenString = url.searchParams.get('token');
	if (!tokenString) return json({ status: 2 }); // no token provided

	const token = await getToken(tokenString, TokenType.Discord);
	if (!token || tokenIsExpired(token)) return json({ status: 3 }); // invalid or expired token

	const { discordUserId } = token.data as { discordUserId: string };

	const [existingForUser, existingForDiscord] = await Promise.all([
		db.query.dcUsers.findFirst({ where: { userId: locals.user.id } }),
		db.query.dcUsers.findFirst({ where: { discordUserId } })
	]);
	if (existingForUser) return json({ status: 4 }); // this RizinOS account already has a linked Discord account
	if (existingForDiscord) return json({ status: 5 }); // this Discord account is already linked to a different account

	try {
		await db
			.insert(dcUsers)
			.values({ name: locals.user.username, discordUserId, userId: locals.user.id });
	} catch {
		return json({ status: 3 });
	}

	await revokeToken(tokenString);
	await notifyLinkSuccess(discordUserId, locals.user.username);

	return json({ status: 0 });
};
