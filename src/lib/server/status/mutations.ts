import { desc, eq, inArray } from 'drizzle-orm';
import type { z } from 'zod';
import { db } from '$db';
import {
	statusComponents,
	statusIncidentComponents,
	statusIncidents,
	statusIncidentUpdates,
	statusMaintenance,
	statusMaintenanceComponents
} from '$db/schema';
import type { UserID } from '$types';
import { notifyStatus, type StatusNotice } from '#lib/server/discordBot.js';
import { invalidatePublicStatus, writeMeta } from './queries';
import { maintenancePhase } from './summary';
import type { IncidentStatus } from './types';
import type * as v from './validate';

/** Thrown for problems the admin can fix; the route turns it into a 400/404. */
export class StatusError extends Error {
	constructor(
		message: string,
		public status = 400
	) {
		super(message);
	}
}

const DEFAULT_RESOLVE_BODY = 'This incident has been resolved.';

async function componentNames(slugs: string[]): Promise<string[]> {
	if (!slugs.length) return [];
	const rows = await db
		.select({ slug: statusComponents.slug, name: statusComponents.name })
		.from(statusComponents)
		.where(inArray(statusComponents.slug, slugs));
	return slugs.map((s) => rows.find((r) => r.slug === s)?.name ?? s);
}

async function assertComponents(slugs: string[]) {
	if (!slugs.length) return;
	const rows = await db
		.select({ slug: statusComponents.slug })
		.from(statusComponents)
		.where(inArray(statusComponents.slug, slugs));
	const missing = slugs.filter((s) => !rows.some((r) => r.slug === s));
	if (missing.length) throw new StatusError(`Unknown component: ${missing.join(', ')}`);
}

async function loadIncident(id: string) {
	const [incident] = await db.select().from(statusIncidents).where(eq(statusIncidents.id, id));
	if (!incident) throw new StatusError('Incident not found', 404);
	const links = await db
		.select({ component: statusIncidentComponents.component })
		.from(statusIncidentComponents)
		.where(eq(statusIncidentComponents.incidentId, id));
	return { incident, components: links.map((l) => l.component) };
}

async function replaceIncidentComponents(incidentId: string, slugs: string[]) {
	await db
		.delete(statusIncidentComponents)
		.where(eq(statusIncidentComponents.incidentId, incidentId));
	if (slugs.length)
		await db
			.insert(statusIncidentComponents)
			.values(slugs.map((component) => ({ incidentId, component })));
}

/** Posts or edits the Discord notice for an incident and remembers the message id. */
async function announceIncident(id: string, event: StatusNotice['event']) {
	const { incident, components } = await loadIncident(id);
	if (!incident.published) return;
	const [latest] = await db
		.select()
		.from(statusIncidentUpdates)
		.where(eq(statusIncidentUpdates.incidentId, id))
		.orderBy(desc(statusIncidentUpdates.createdAt))
		.limit(1);

	const messageId = await notifyStatus({
		kind: 'incident',
		event,
		id,
		title: incident.title,
		status: incident.status,
		impact: incident.impact,
		components: await componentNames(components),
		body: latest?.body,
		messageId: incident.discordMessageId
	});
	if (messageId && messageId !== incident.discordMessageId)
		await db
			.update(statusIncidents)
			.set({ discordMessageId: messageId })
			.where(eq(statusIncidents.id, id));
}

export async function createIncident(input: z.infer<typeof v.incidentCreate>, authorId: UserID) {
	await assertComponents(input.components);
	const [incident] = await db
		.insert(statusIncidents)
		.values({
			title: input.title,
			status: input.status,
			impact: input.impact,
			source: 'manual',
			published: input.publish,
			authorId,
			resolvedAt: input.status === 'resolved' ? new Date() : null
		})
		.returning({ id: statusIncidents.id });
	await replaceIncidentComponents(incident.id, input.components);
	await db
		.insert(statusIncidentUpdates)
		.values({ incidentId: incident.id, status: input.status, body: input.body, authorId });

	invalidatePublicStatus();
	await announceIncident(incident.id, input.status === 'resolved' ? 'resolved' : 'created');
	return incident.id;
}

export async function updateIncident(input: z.infer<typeof v.incidentUpdate>, authorId: UserID) {
	const { incident } = await loadIncident(input.id);
	if (input.components) await assertComponents(input.components);

	const status: IncidentStatus = input.status ?? incident.status;
	const statusChanged = status !== incident.status;
	let body = input.body?.trim() ?? '';
	if (!body && statusChanged && status === 'resolved') body = DEFAULT_RESOLVE_BODY;
	if (!body && statusChanged) throw new StatusError('Describe what changed in the update text.');

	await db
		.update(statusIncidents)
		.set({
			title: input.title ?? incident.title,
			impact: input.impact ?? incident.impact,
			status,
			resolvedAt: status === 'resolved' ? (incident.resolvedAt ?? new Date()) : null,
			updatedAt: new Date()
		})
		.where(eq(statusIncidents.id, incident.id));
	if (input.components) await replaceIncidentComponents(incident.id, input.components);
	if (body)
		await db
			.insert(statusIncidentUpdates)
			.values({ incidentId: incident.id, status, body, authorId });

	invalidatePublicStatus();
	const changed = statusChanged || !!body || !!input.title || !!input.impact || !!input.components;
	if (changed) await announceIncident(incident.id, status === 'resolved' ? 'resolved' : 'updated');
}

/** Makes a draft (e.g. auto-detected) incident visible on the page and in Discord. */
export async function publishIncident(id: string) {
	const { incident } = await loadIncident(id);
	if (incident.published) throw new StatusError('Incident is already published');
	await db
		.update(statusIncidents)
		.set({ published: true, updatedAt: new Date() })
		.where(eq(statusIncidents.id, id));
	invalidatePublicStatus();
	await announceIncident(id, incident.status === 'resolved' ? 'resolved' : 'created');
}

export async function deleteIncident(id: string) {
	const { incident } = await loadIncident(id);
	await db.delete(statusIncidents).where(eq(statusIncidents.id, incident.id));
	invalidatePublicStatus();
}

// ---------------------------------------------------------------------------
// Maintenance
// ---------------------------------------------------------------------------

async function replaceMaintenanceComponents(maintenanceId: string, slugs: string[]) {
	await db
		.delete(statusMaintenanceComponents)
		.where(eq(statusMaintenanceComponents.maintenanceId, maintenanceId));
	if (slugs.length)
		await db
			.insert(statusMaintenanceComponents)
			.values(slugs.map((component) => ({ maintenanceId, component })));
}

async function announceMaintenance(id: string, event: StatusNotice['event']) {
	const [m] = await db.select().from(statusMaintenance).where(eq(statusMaintenance.id, id));
	if (!m) return;
	const links = await db
		.select({ component: statusMaintenanceComponents.component })
		.from(statusMaintenanceComponents)
		.where(eq(statusMaintenanceComponents.maintenanceId, id));
	const messageId = await notifyStatus({
		kind: 'maintenance',
		event,
		id,
		title: m.title,
		status: maintenancePhase(m, new Date()),
		components: await componentNames(links.map((l) => l.component)),
		body: m.description,
		startsAt: m.startsAt.toISOString(),
		endsAt: m.endsAt.toISOString(),
		messageId: m.discordMessageId
	});
	if (messageId && messageId !== m.discordMessageId)
		await db
			.update(statusMaintenance)
			.set({ discordMessageId: messageId })
			.where(eq(statusMaintenance.id, id));
}

export async function createMaintenance(
	input: z.infer<typeof v.maintenanceCreate>,
	authorId: UserID
) {
	await assertComponents(input.components);
	if (!input.components.length) throw new StatusError('Pick at least one component');
	const [m] = await db
		.insert(statusMaintenance)
		.values({
			title: input.title,
			description: input.description,
			startsAt: input.startsAt,
			endsAt: input.endsAt,
			authorId
		})
		.returning({ id: statusMaintenance.id });
	await replaceMaintenanceComponents(m.id, input.components);
	invalidatePublicStatus();
	await announceMaintenance(m.id, 'created');
	return m.id;
}

export async function updateMaintenance(input: z.infer<typeof v.maintenanceUpdate>) {
	await assertComponents(input.components);
	if (!input.components.length) throw new StatusError('Pick at least one component');
	const [existing] = await db
		.select()
		.from(statusMaintenance)
		.where(eq(statusMaintenance.id, input.id));
	if (!existing) throw new StatusError('Maintenance not found', 404);
	await db
		.update(statusMaintenance)
		.set({
			title: input.title,
			description: input.description,
			startsAt: input.startsAt,
			endsAt: input.endsAt,
			updatedAt: new Date()
		})
		.where(eq(statusMaintenance.id, input.id));
	await replaceMaintenanceComponents(input.id, input.components);
	invalidatePublicStatus();
	await announceMaintenance(input.id, 'updated');
}

export async function cancelMaintenance(id: string) {
	const [existing] = await db.select().from(statusMaintenance).where(eq(statusMaintenance.id, id));
	if (!existing) throw new StatusError('Maintenance not found', 404);
	await db
		.update(statusMaintenance)
		.set({ cancelledAt: new Date(), updatedAt: new Date() })
		.where(eq(statusMaintenance.id, id));
	invalidatePublicStatus();
	await announceMaintenance(id, 'cancelled');
}

export async function deleteMaintenance(id: string) {
	await db.delete(statusMaintenance).where(eq(statusMaintenance.id, id));
	invalidatePublicStatus();
}

// ---------------------------------------------------------------------------
// Components and probes
// ---------------------------------------------------------------------------

export async function updateComponent(input: z.infer<typeof v.componentUpdate>) {
	const { slug, ...patch } = input;
	const set = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
	if (!Object.keys(set).length) return;
	const updated = await db
		.update(statusComponents)
		.set(set)
		.where(eq(statusComponents.slug, slug))
		.returning({ slug: statusComponents.slug });
	if (!updated.length) throw new StatusError('Component not found', 404);
	invalidatePublicStatus();
}

/** Asks the prober to run a probe right away. The prober polls this flag every few seconds. */
export async function requestProbe(slug: string | undefined) {
	await writeMeta('probeRequest', { slug: slug ?? null });
}
