import { DISCORD_BOT_SECRET, DISCORD_BOT_URL } from '$env/static/private';
import { PUBLIC_ORIGIN } from '$env/static/public';
import { db } from '$db';
import { BanType } from '$types';
import Logger from '$lib/server/models/Logger';

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
			headers: { 'content-type': 'application/json', authorization: `Bearer ${DISCORD_BOT_SECRET}` },
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
	reason: string | null,
	until: Date | null
): Promise<void> {
	const discordUserId = await resolveDiscordUserId(type, subjectId);
	if (!discordUserId) return;

	const unbanUrl = `https://${PUBLIC_ORIGIN}/unban-request?type=${type}&id=${encodeURIComponent(subjectId)}`;

	await callBot('/dm/ban', {
		discordUserId,
		system: SYSTEM_LABELS[type],
		reason,
		until: until?.toISOString() ?? null,
		unbanUrl
	});
}

/** Bannt den User serverseitig vom Discord-Server. Nur für BanType.Discord relevant. */
export async function executeDiscordBan(discordUserId: string, reason: string | null): Promise<void> {
	await callBot('/ban', { discordUserId, reason });
}

/** Hebt einen Discord-Server-Bann auf. Nur für BanType.Discord relevant. */
export async function liftDiscordBan(discordUserId: string): Promise<void> {
	await callBot('/unban', { discordUserId });
}
