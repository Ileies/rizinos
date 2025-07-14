import { json } from '@sveltejs/kit';
import { hasRole } from '$lib/server/models/User';
import { invalidMethod } from '$lib/server';
import type { RequestEvent } from './$types';
import { db } from '$db';
import { Role } from '$types';

export async function POST(event: RequestEvent) {
	const { uuid } = await event.request.json() as { uuid: string | null };
	const data = await db.query.mcUsers.findFirst({
		where: (mcUsers, { eq }) => eq(mcUsers.uuid, uuid ?? ''),
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
	if (!data) return json(null);

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

	return json({
		username: data.user.username,
		welcomeMessage: data.welcomeMessage ?? '',
		permissions: data.permissions,
		credit: data.user.credit,
		home: data.homeLocation,
		mutedUntil: data.mutedUntil,
		bannedUntil: data.bannedUntil,
		bannedReason: data.bannedReason
	});
}

export const GET = invalidMethod;
