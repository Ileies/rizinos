import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Role } from '$types';
import { hasRole } from '$lib/server/models/User';

function formatUuid(id: string): string {
	const s = id.replace(/-/g, '');
	return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user || !hasRole(locals.user, Role.Admin)) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	const type = url.searchParams.get('type');
	const value = url.searchParams.get('value')?.trim();

	if (!type || !value) return json({ error: 'Missing params' }, { status: 400 });

	try {
		if (type === 'username') {
			const res = await fetch(
				`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(value)}`
			);
			if (res.status === 404 || res.status === 204) {
				return json({ error: 'Player not found' }, { status: 404 });
			}
			if (!res.ok) return json({ error: 'Mojang API error' }, { status: 502 });
			const data = await res.json();
			return json({ name: data.name, uuid: formatUuid(data.id) });
		} else if (type === 'uuid') {
			const normalized = value.replace(/-/g, '');
			const res = await fetch(
				`https://sessionserver.mojang.com/session/minecraft/profile/${normalized}`
			);
			if (res.status === 404 || res.status === 204) {
				return json({ error: 'Player not found' }, { status: 404 });
			}
			if (!res.ok) return json({ error: 'Mojang API error' }, { status: 502 });
			const data = await res.json();
			return json({ name: data.name, uuid: formatUuid(data.id) });
		} else {
			return json({ error: 'Invalid type' }, { status: 400 });
		}
	} catch {
		return json({ error: 'Network error' }, { status: 502 });
	}
};
