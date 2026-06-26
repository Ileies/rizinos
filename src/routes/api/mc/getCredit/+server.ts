import { json, type RequestEvent } from '@sveltejs/kit';
import { invalidMethod } from '$lib/server';
import { db } from '$db';

export async function POST(event: RequestEvent) {
	const { uuid, uuids } = await event.request.json();

	if (uuid) {
		const credit = (await db.query.mcUsers.findFirst({
			where: { uuid },
			with: { user: { columns: { credit: true } } },
			columns: { uuid: true }
		}))?.user.credit ?? null;
		console.log('[mc/getCredit:14] single lookup uuid=%s → credit=%s', uuid, credit);
		return json(credit);
	} else if (uuids) {
		const credits = (await db.query.mcUsers.findMany({
			where: { uuid: { in: uuids } },
			with: { user: { columns: { credit: true } } },
			columns: { uuid: true }
		})).map(credit => {
			return { uuid: credit.uuid, credit: credit.user.credit };
		});
		return json(credits);
	} else {
		console.log('[mc/getCredit:27] no uuid or uuids provided, returning null');
		return json(null);
	}
}

export const GET = invalidMethod;
