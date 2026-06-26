import { json, type RequestEvent } from '@sveltejs/kit';
import { db } from '$db';
import { mcWarps } from '$db/schema';
import { eq } from 'drizzle-orm';
import type { Restrict } from '$types/user';
import { invalidMethod } from '$lib/server';

export async function POST(event: RequestEvent) {
	const { warpName, location, restrict } = await event.request.json();
	console.log('[mc/setWarp:9] POST received:', { warpName, location, restrict });

	if (!warpName) {
		console.log('[mc/setWarp:12] warpName missing, returning false');
		return json(false);
	}

	const warp = await db.query.mcWarps.findFirst({ where: { name: warpName } });
	console.log(
		'[mc/setWarp:18] existing warp lookup for name="%s":',
		warpName,
		warp ? 'found' : 'not found'
	);

	const data: { name: string; restrict?: Restrict[]; location?: string } = { name: warpName };
	if (restrict) {
		const users = await db.query.mcUsers.findMany({ columns: { uuid: true, userId: true } });
		console.log('[mc/setWarp:23] loaded %d users for uuid→userId mapping', users.length);
		if (!users) return json(false);
		const idMap: Record<string, string> = {};
		for (const userData of users) idMap[userData.uuid] = userData.userId;
		data.restrict = (restrict as string[])
			.map((r) =>
				r.includes('@')
					? r
					: idMap[r] == null
						? null
						: r.startsWith('!')
							? `!${idMap[r]}`
							: idMap[r]
			)
			.filter((r) => r != null) as Restrict[];
		console.log(
			'[mc/setWarp:29] restrict resolved: %d input → %d output entries:',
			restrict.length,
			data.restrict.length,
			data.restrict
		);
	}
	if (location) data.location = location;

	if (warp) {
		if (location || restrict) {
			console.log('[mc/setWarp:35] updating warp "%s":', warpName, data);
			await db.update(mcWarps).set(data).where(eq(mcWarps.name, warpName));
		} else {
			console.log(
				'[mc/setWarp:39] deleting warp "%s" (no location or restrict provided)',
				warpName
			);
			await db.delete(mcWarps).where(eq(mcWarps.name, warpName));
		}
	} else {
		if (!data.location || !data.restrict) {
			console.log(
				'[mc/setWarp:44] cannot create new warp "%s": missing location=%s or restrict=%s',
				warpName,
				data.location,
				data.restrict
			);
			return json(false);
		}
		console.log('[mc/setWarp:48] inserting new warp "%s":', warpName, data);
		await db
			.insert(mcWarps)
			.values(data as { name: string; restrict: Restrict[]; location: string });
	}
	console.log('[mc/setWarp:51] setWarp complete for "%s", returning true', warpName);
	return json(true);
}

export const GET = invalidMethod;
