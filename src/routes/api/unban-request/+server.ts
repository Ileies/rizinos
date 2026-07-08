import { json, type RequestHandler } from '@sveltejs/kit';
import { invalidMethod } from '$lib/server';
import { db } from '$db';
import { unbanRequests } from '$db/schema';
import { BanType } from '$types';

export const POST: RequestHandler = async ({ request }) => {
	const { type, id, message } = (await request.json()) as {
		type?: string;
		id?: string;
		message?: string;
	};

	if (!type || !id || !message?.trim()) {
		return json({ error: 'Typ, Kennung und Nachricht erforderlich.' }, { status: 400 });
	}

	let subjectId: string;
	let label: string;

	switch (type) {
		case BanType.Minecraft: {
			const mcUser = await db.query.mcUsers.findFirst({ where: { uuid: id } });
			if (!mcUser?.bannedUntil) {
				return json({ error: 'Kein aktiver Bann für diesen Account gefunden.' }, { status: 400 });
			}
			subjectId = mcUser.uuid;
			label = mcUser.name;
			break;
		}

		case BanType.Discord: {
			const dcUser = await db.query.dcUsers.findFirst({ where: { discordUserId: id } });
			if (!dcUser?.bannedUntil) {
				return json({ error: 'Kein aktiver Bann für diesen Account gefunden.' }, { status: 400 });
			}
			subjectId = dcUser.discordUserId;
			label = dcUser.name;
			break;
		}

		case BanType.Rizinos: {
			const user = await db.query.users.findFirst({
				where: { OR: [{ username: id }, { email: id }] }
			});
			if (!user?.bannedUntil) {
				return json({ error: 'Kein aktiver Bann für diesen Account gefunden.' }, { status: 400 });
			}
			subjectId = user.id;
			label = user.username;
			break;
		}

		default:
			return json({ error: 'Unbekannter Ban-Typ.' }, { status: 400 });
	}

	const pending = await db.query.unbanRequests.findFirst({
		where: { type, subjectId, status: 'pending' }
	});
	if (pending) {
		return json({ error: 'Es liegt bereits ein offener Antrag vor.' }, { status: 400 });
	}

	await db.insert(unbanRequests).values({ type: type as BanType, subjectId, label, message: message.trim() });
	return json({ success: true });
};

export const GET = invalidMethod;
