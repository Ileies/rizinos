import { db } from '$db';
import { BanType } from '$types';

// Kein 0/O/1/I - schwer zu verwechseln, wenn der Code manuell abgetippt wird.
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(length: number): string {
	const bytes = crypto.getRandomValues(new Uint8Array(length));
	return Array.from(bytes, (b) => CHARSET[b % CHARSET.length]).join('');
}

/**
 * Erzeugt eine eindeutige, zufällige Ban-ID. Diese wird dem gebannten Nutzer mitgeteilt
 * und ist die einzige Möglichkeit, einen Unban-Antrag zu stellen - so kann niemand einen
 * Antrag im Namen eines anderen Accounts stellen oder erraten, ob ein Account gebannt ist.
 */
export async function generateBanId(): Promise<string> {
	for (;;) {
		const banId = randomCode(8);
		const [mc, dc, u] = await Promise.all([
			db.query.mcUsers.findFirst({ where: { banId } }),
			db.query.dcUsers.findFirst({ where: { banId } }),
			db.query.users.findFirst({ where: { banId } })
		]);
		if (!mc && !dc && !u) return banId;
	}
}

export interface BanLookup {
	type: BanType;
	subjectId: string;
	label: string;
}

/** Findet den gebannten Account anhand der Ban-ID, unabhängig vom Ban-Typ. */
export async function findByBanId(banId: string): Promise<BanLookup | null> {
	const mcUser = await db.query.mcUsers.findFirst({ where: { banId } });
	if (mcUser) return { type: BanType.Minecraft, subjectId: mcUser.uuid, label: mcUser.name };

	const dcUser = await db.query.dcUsers.findFirst({ where: { banId } });
	if (dcUser) return { type: BanType.Discord, subjectId: dcUser.discordUserId, label: dcUser.name };

	const user = await db.query.users.findFirst({ where: { banId } });
	if (user) return { type: BanType.Rizinos, subjectId: user.id, label: user.username };

	return null;
}
