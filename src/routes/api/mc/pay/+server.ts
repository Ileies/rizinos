import { json } from '@sveltejs/kit';
import { invalidMethod } from '$lib/server';
import { getSystemUser } from '$lib/server/models/User';
import Transaction from '$lib/server/models/Transaction';
import type { RequestEvent } from './$types';
import { db } from '$db';

export const GET = invalidMethod;

export async function POST(event: RequestEvent) {
	const { from, to, amount } = await event.request.json() as { from: string | null, to: string, amount: number };
	console.log('[mc/pay:11] POST received:', { from, to, amount });

	if (!to || !amount) {
		console.log('[mc/pay:14] Missing "to" or "amount", returning false');
		return json(false);
	}

	const toUserData = (await db.query.mcUsers.findFirst({
		where: { uuid: to },
		with: { user: true }
	}))?.user;
	console.log('[mc/pay:22] toUser lookup for uuid=%s:', to,
		toUserData ? `found (id=${toUserData.id}, username=${toUserData.username})` : 'not found → returning false');
	if (!toUserData) return json(false);

	if (!from) {
		console.log('[mc/pay:27] from=null → system purchase: %d diamonds for user %s (id=%s)', amount, toUserData.username, toUserData.id);
		try {
			await Transaction.purchase(await getSystemUser(), toUserData, amount * 10, 'Minecraft diamonds sold');
			console.log('[mc/pay:30] Transaction.purchase succeeded');
			return json(true);
		} catch (error) {
			console.error('[mc/pay:33] Transaction.purchase failed:', { amount, toId: toUserData.id, error });
			return json(false);
		}
	}

	const fromUserData = (await db.query.mcUsers.findFirst({
		where: { uuid: from },
		with: { user: true }
	}))?.user;
	console.log('[mc/pay:42] fromUser lookup for uuid=%s:', from,
		fromUserData ? `found (id=${fromUserData.id}, username=${fromUserData.username})` : 'not found → returning false');
	if (!fromUserData) return json(false);

	console.log('[mc/pay:46] player-to-player transaction not yet implemented, returning false');
	// TODO: Initiate transaction
	return json(false);
}
