import { json } from '@sveltejs/kit';
import { invalidMethod } from '$lib/server';
import { getSystemUser } from '$lib/server/models/User';
import Transaction from '$lib/server/models/Transaction';
import type { RequestEvent } from './$types';
import { db } from '$db';

export const GET = invalidMethod;

export async function POST(event: RequestEvent) {
	const { from, to, amount } = await event.request.json() as { from: string | null, to: string, amount: number };

	if (!to || !amount) return json(false);

	const toUserData = (await db.query.mcUsers.findFirst({
		where: (mcUsers, { eq }) => eq(mcUsers.uuid, to),
		with: { user: true }
	}))?.user;
	if (!toUserData) return json(false);

	if (!from) {
		try {
			await Transaction.purchase(await getSystemUser(), toUserData, amount * 10, 'Minecraft diamonds sold');
			return json(true);
		} catch (error) {
			console.error('Failed to donate', { amount, to: toUserData.id, error });
			return json(false);
		}
	}

	const fromUserData = (await db.query.mcUsers.findFirst({
		where: (mcUsers, { eq }) => eq(mcUsers.uuid, from),
		with: { user: true }
	}))?.user;
	if (!fromUserData) return json(false);

	// TODO: Initiate transaction
	return json(false);
}
