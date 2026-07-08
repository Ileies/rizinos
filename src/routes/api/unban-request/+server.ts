import { json, type RequestHandler } from '@sveltejs/kit';
import { invalidMethod } from '$lib/server';
import { db } from '$db';
import { unbanRequests } from '$db/schema';
import { findByBanId } from '$lib/server/models/Ban';

export const POST: RequestHandler = async ({ request }) => {
	const { banId, message } = (await request.json()) as { banId?: string; message?: string };

	if (!banId?.trim() || !message?.trim()) {
		return json({ error: 'Ban-ID und Nachricht erforderlich.' }, { status: 400 });
	}

	const normalizedBanId = banId.trim().toUpperCase();
	const match = await findByBanId(normalizedBanId);
	if (!match) {
		return json({ error: 'Unbekannte Ban-ID.' }, { status: 400 });
	}

	const pending = await db.query.unbanRequests.findFirst({
		where: { type: match.type, subjectId: match.subjectId, status: 'pending' }
	});
	if (pending) {
		return json({ error: 'Es liegt bereits ein offener Antrag vor.' }, { status: 400 });
	}

	await db.insert(unbanRequests).values({
		type: match.type,
		subjectId: match.subjectId,
		banId: normalizedBanId,
		label: match.label,
		message: message.trim()
	});
	return json({ success: true });
};

export const GET = invalidMethod;
