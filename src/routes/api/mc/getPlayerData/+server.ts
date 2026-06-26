import { json } from '@sveltejs/kit';
import { hasRole } from '$lib/server/models/User';
import { invalidMethod } from '$lib/server';
import type { RequestEvent } from './$types';
import { db } from '$db';
import { Role } from '$types';

export async function POST(event: RequestEvent) {
	const { uuid } = await event.request.json() as { uuid: string | null };
	console.log('[mc/getPlayerData:10] POST received: uuid=%s', uuid);

	const data = await db.query.mcUsers.findFirst({
		where: { uuid: uuid ?? '' },
		with: {
			user: { columns: { passwordHash: false } }
		},
		columns: {
			welcomeMessage: true,
			homeLocation: true,
			permissions: true,
			mutedUntil: true,
			bannedUntil: true,
			bannedReason: true
		}
	});
	console.log('[mc/getPlayerData:25] db lookup result:', data
		? `found (username=${data.user.username}, basePermissions=${data.permissions.length}, muted=${data.mutedUntil}, banned=${data.bannedUntil})`
		: 'null → returning null');
	if (!data) return json(null);

	const permsBefore = data.permissions.length;
	if (hasRole(data.user, Role.User)) [
		'mikosav.user',
		'plots.plot.1',
		'plots.auto.1',
		'plots.permpack.basic'
	].forEach(i => data.permissions.push(i));
	if (hasRole(data.user, Role.BetaTester)) [
		'mikosav.beta',
		'mikosav.command.day',
		'plots.plot.4',
		'plots.auto.4',
		'minecraft.command.fly',
		'mikosav.perm.warpsign'
	].forEach(i => data.permissions.push(i));
	if (hasRole(data.user, Role.Moderator)) [
		'mikosav.moderator',
		'plots.plot.10',
		'plots.auto.10',
		'minecraft.command.kick',
		'minecraft.command.ban'
	].forEach(i => data.permissions.push(i));
	if (hasRole(data.user, Role.Admin)) data.permissions.push('mikosav.admin');

	const addedPerms = data.permissions.slice(permsBefore);
	console.log('[mc/getPlayerData:55] role injection: was %d, now %d permissions. Added: [%s]',
		permsBefore, data.permissions.length, addedPerms.join(', ') || 'none');

	const response = {
		username: data.user.username,
		welcomeMessage: data.welcomeMessage ?? '',
		permissions: data.permissions,
		credit: data.user.credit,
		home: data.homeLocation,
		mutedUntil: data.mutedUntil,
		bannedUntil: data.bannedUntil,
		bannedReason: data.bannedReason
	};
	console.log('[mc/getPlayerData:67] returning response for username=%s: credit=%s, home=%s, permissions=%d',
		response.username, response.credit, response.home, response.permissions.length);
	return json(response);
}

export const GET = invalidMethod;
