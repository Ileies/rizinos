import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$db';
import { Role } from '$types';
import { hasRole } from '$lib/server/models/User';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(302, '/login');
	if (!hasRole(locals.user, Role.Admin)) redirect(302, '/app');

	const dcUsers = await db.query.dcUsers.findMany({
		with: { user: { columns: { username: true } } },
		orderBy: (dcUsers, { asc }) => asc(dcUsers.name)
	});

	return { dcUsers };
};
