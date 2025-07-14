import { json, type RequestEvent } from '@sveltejs/kit';
import { db } from '$db';
import { mcWarps } from '$db/schema';
import { eq } from 'drizzle-orm';
import type { Restrict } from '$types/user';
import { invalidMethod } from '$lib/server';

export async function POST(event: RequestEvent) {
	const { warpName, location, restrict } = await event.request.json();
	if (!warpName) return json(false);

	const warp = await db.query.mcWarps.findFirst({ where: eq(mcWarps.name, warpName) });
	const data: { name: string, restrict?: Restrict[], location?: string } = { name: warpName };
	if (restrict) {
		const users = await db.query.mcUsers.findMany({ columns: { uuid: true, userId: true } });
		if (!users) return json(false);
		const idMap: Record<string, string> = {};
		for (const userData of users) idMap[userData.uuid] = userData.userId;
		data.restrict = (restrict as string[]).map((r) => r.includes('@') ? r : idMap[r] == null ? null :
			r.startsWith('!') ? `!${idMap[r]}` : idMap[r]).filter(r => r != null) as Restrict[];
	}
	if (location) data.location = location;
	if (warp) {
		if (location || restrict) await db.update(mcWarps).set(data).where(eq(mcWarps.name, warpName));
		else await db.delete(mcWarps).where(eq(mcWarps.name, warpName));
	} else {
		if (!data.location || !data.restrict) return json(false);
		await db.insert(mcWarps).values(data as { name: string, restrict: Restrict[], location: string });
	}
	return json(true);
}

export const GET = invalidMethod;
