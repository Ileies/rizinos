import { json, type RequestEvent } from '@sveltejs/kit';
import { invalidMethod } from '$lib/server';
import { db } from '$db';

export async function POST(event: RequestEvent) {
	const { uuid, uuids } = await event.request.json();
	if (uuid) {
		const credit = (await db.query.mcUsers.findFirst({
			where: (mcUsers, { eq }) => eq(mcUsers.uuid, uuid),
			with: { user: { columns: { credit: true } } },
			columns: { uuid: true }
		}))?.user.credit ?? null;
		return json(credit);
	} else if (uuids) {
		const credits = (await db.query.mcUsers.findMany({
			where: (mcUsers, { inArray }) => inArray(mcUsers.uuid, uuids),
			with: { user: { columns: { credit: true } } },
			columns: { uuid: true }
		})).map(credit => {
			return { uuid: credit.uuid, credit: credit.user.credit };
		});
		return json(credits);
	} else return json(null);
}

export const GET = invalidMethod;
