import { json, type RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';
import { Role } from '$types';
import { hasRole } from '#lib/server/models/User.js';
import Logger from '#lib/server/models/Logger.js';
import { loadAdminStatus } from '#lib/server/status/queries.js';
import * as mutations from '#lib/server/status/mutations.js';
import * as v from '#lib/server/status/validate.js';

function isAdmin(locals: App.Locals) {
	return !!locals.user && hasRole(locals.user, Role.Admin);
}

const forbidden = () => json({ message: 'Forbidden' }, { status: 403 });

export const GET: RequestHandler = async ({ locals }) => {
	if (!isAdmin(locals)) return forbidden();
	return json(await loadAdminStatus(), { headers: { 'cache-control': 'no-store' } });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!isAdmin(locals)) return forbidden();
	const authorId = locals.user!.id;

	let body: { action?: string };
	try {
		body = await request.json();
	} catch {
		return json({ message: 'Invalid JSON' }, { status: 400 });
	}

	try {
		switch (body.action) {
			case 'incidentCreate': {
				const id = await mutations.createIncident(v.incidentCreate.parse(body), authorId);
				return json({ success: true, id });
			}
			case 'incidentUpdate':
				await mutations.updateIncident(v.incidentUpdate.parse(body), authorId);
				return json({ success: true });
			case 'incidentPublish':
				await mutations.publishIncident(v.idOnly.parse(body).id);
				return json({ success: true });
			case 'incidentDelete':
				await mutations.deleteIncident(v.idOnly.parse(body).id);
				return json({ success: true });

			case 'maintenanceCreate': {
				const id = await mutations.createMaintenance(v.maintenanceCreate.parse(body), authorId);
				return json({ success: true, id });
			}
			case 'maintenanceUpdate':
				await mutations.updateMaintenance(v.maintenanceUpdate.parse(body));
				return json({ success: true });
			case 'maintenanceCancel':
				await mutations.cancelMaintenance(v.idOnly.parse(body).id);
				return json({ success: true });
			case 'maintenanceDelete':
				await mutations.deleteMaintenance(v.idOnly.parse(body).id);
				return json({ success: true });

			case 'componentUpdate':
				await mutations.updateComponent(v.componentUpdate.parse(body));
				return json({ success: true });
			case 'probeNow':
				await mutations.requestProbe(v.probeNow.parse(body).slug);
				return json({ success: true });

			default:
				return json({ message: 'Unknown action' }, { status: 400 });
		}
	} catch (err) {
		if (err instanceof z.ZodError) return json({ message: v.firstIssue(err) }, { status: 400 });
		if (err instanceof mutations.StatusError)
			return json({ message: err.message }, { status: err.status });
		Logger.error('Status admin action failed.', err);
		return json({ message: 'Internal error' }, { status: 500 });
	}
};
