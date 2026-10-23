import { DISCORD_BOT_SECRET, DISCORD_BOT_URL } from '$app/env/private';
import { PUBLIC_ORIGIN } from '$app/env/public';
import { db } from '$db';
import { BanType } from '$types';
import Logger from '#lib/server/models/Logger.js';

const SYSTEM_LABELS: Record<BanType, string> = {
	[BanType.Minecraft]: 'RizinOS Minecraft',
	[BanType.Discord]: 'RizinOS Discord',
	[BanType.Rizinos]: 'RizinOS'
};

async function resolveDiscordUserId(type: BanType, subjectId: string): Promise<string | null> {
	if (type === BanType.Discord) return subjectId;

	if (type === BanType.Minecraft) {
		const viaMinechat = await db.query.minechatUsers.findFirst({
			where: { minecraftUuid: subjectId }
		});
		if (viaMinechat) return viaMinechat.discordUserId;

		const mcUser = await db.query.mcUsers.findFirst({
			where: { uuid: subjectId },
			with: { user: { with: { dcUser: true } } }
		});
		return mcUser?.user.dcUser?.discordUserId ?? null;
	}

	// BanType.Rizinos: subjectId ist die users.id
	const dcUser = await db.query.dcUsers.findFirst({ where: { userId: subjectId } });
	return dcUser?.discordUserId ?? null;
}

async function callBot(path: string, body: Record<string, unknown>): Promise<boolean> {
	try {
		const res = await fetch(`${DISCORD_BOT_URL}${path}`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				authorization: `Bearer ${DISCORD_BOT_SECRET}`
			},
			body: JSON.stringify(body)
		});
		if (!res.ok) Logger.warn(`Discord bot call to ${path} failed`, { status: res.status });
		return res.ok;
	} catch (err) {
		Logger.warn(`Discord bot call to ${path} failed`, err);
		return false;
	}
}

/** Benachrichtigt den gebannten User per Discord-DM inkl. Link zum Unban-Antrag. Schlägt lautlos fehl, falls kein Discord-Konto verknüpft oder der Bot nicht erreichbar ist. */
export async function notifyBan(
	type: BanType,
	subjectId: string,
	banId: string,
	reason: string | null,
	until: Date | null
): Promise<void> {
	const discordUserId = await resolveDiscordUserId(type, subjectId);
	if (!discordUserId) return;

	const unbanUrl = `https://${PUBLIC_ORIGIN}/unban-request/?id=${encodeURIComponent(banId)}`;

	await callBot('/dm/ban', {
		discordUserId,
		system: SYSTEM_LABELS[type],
		reason,
		until: until?.toISOString() ?? null,
		unbanUrl,
		banId
	});
}

/** Bannt den User serverseitig vom Discord-Server. Nur für BanType.Discord relevant. */
export async function executeDiscordBan(
	discordUserId: string,
	reason: string | null
): Promise<void> {
	await callBot('/ban', { discordUserId, reason });
}

/** Hebt einen Discord-Server-Bann auf. Nur für BanType.Discord relevant. */
export async function liftDiscordBan(discordUserId: string): Promise<void> {
	await callBot('/unban', { discordUserId });
}

/** Meldet dem Discord-Bot eine neue Kontaktnachricht, damit das Team sie im Staff-Kanal sieht. Schlägt lautlos fehl. */
export async function notifyContact(info: {
	ref: string;
	topic: string;
	subject: string;
	preview: string;
	attachments: number;
	signedIn: boolean;
}): Promise<void> {
	await callBot('/contact/notify', {
		...info,
		adminUrl: `https://${PUBLIC_ORIGIN}/admin`
	});
}

/** Meldet dem Discord-Bot eine erfolgreich abgeschlossene Account-Verknüpfung zu Logging-Zwecken. */
export async function notifyLinkSuccess(
	discordUserId: string,
	rizinosUsername: string
): Promise<void> {
	await callBot('/link/success', { discordUserId, rizinosUsername });
}

export interface StatusNotice {
	kind: 'incident' | 'maintenance';
	event: 'created' | 'updated' | 'resolved' | 'cancelled';
	id: string;
	title: string;
	/** Incident status or maintenance phase. */
	status: string;
	impact?: string;
	/** Display names of the affected components. */
	components: string[];
	/** Latest update text or the maintenance description. */
	body?: string;
	startsAt?: string;
	endsAt?: string;
	/** Message to edit in place. Omitted on creation. */
	messageId?: string | null;
}

/**
 * Posts or edits a status notice in the Discord status channel. Returns the id of the
 * message so later updates edit it in place, or null when the bot could not deliver it.
 */
export async function notifyStatus(notice: StatusNotice): Promise<string | null> {
	try {
		const res = await fetch(`${DISCORD_BOT_URL}/status/notify`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				authorization: `Bearer ${DISCORD_BOT_SECRET}`
			},
			body: JSON.stringify({ ...notice, url: `https://${PUBLIC_ORIGIN}/status` }),
			signal: AbortSignal.timeout(10_000)
		});
		if (!res.ok) {
			Logger.warn('Discord status notice failed', { status: res.status });
			return null;
		}
		const data = (await res.json()) as { messageId?: string };
		return data.messageId ?? null;
	} catch (err) {
		Logger.warn('Discord status notice failed', err);
		return null;
	}
}
