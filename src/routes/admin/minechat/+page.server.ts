import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$db';
import { Role } from '$types';
import { hasRole } from '$lib/server/models/User';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(302, '/login');
	if (!hasRole(locals.user, Role.Admin)) redirect(302, '/app');

	const [users, hooks, servers] = await Promise.all([
		db.query.minechatUsers.findMany(),
		db.query.minechatHooks.findMany({ with: { server: true } }),
		db.query.minechatServers.findMany({ with: { hook: true } })
	]);

	return { users, hooks, servers };
};
