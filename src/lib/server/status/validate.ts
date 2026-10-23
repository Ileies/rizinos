import { z } from 'zod';
import { INCIDENT_IMPACTS, INCIDENT_STATUSES, LIMITS } from './types';

const slug = z.string().regex(/^[a-z0-9-]{1,40}$/);
const text = (max: number) => z.string().trim().max(max);
const date = z
	.string()
	.refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date')
	.transform((v) => new Date(v));
const components = z.array(slug).max(LIMITS.components);

export const incidentCreate = z.object({
	title: text(LIMITS.title).min(3),
	status: z.enum(INCIDENT_STATUSES).default('investigating'),
	impact: z.enum(INCIDENT_IMPACTS).default('minor'),
	components,
	body: text(LIMITS.body).min(3),
	publish: z.boolean().default(true)
});

export const incidentUpdate = z.object({
	id: z.string().min(1),
	title: text(LIMITS.title).min(3).optional(),
	status: z.enum(INCIDENT_STATUSES).optional(),
	impact: z.enum(INCIDENT_IMPACTS).optional(),
	components: components.optional(),
	body: text(LIMITS.body).optional()
});

export const idOnly = z.object({ id: z.string().min(1) });

const maintenanceFields = {
	title: text(LIMITS.title).min(3),
	description: text(LIMITS.description).default(''),
	startsAt: date,
	endsAt: date,
	components
};

export const maintenanceCreate = z
	.object(maintenanceFields)
	.refine((m) => m.endsAt > m.startsAt, { message: 'End must be after start', path: ['endsAt'] });

export const maintenanceUpdate = z
	.object({ id: z.string().min(1), ...maintenanceFields })
	.refine((m) => m.endsAt > m.startsAt, { message: 'End must be after start', path: ['endsAt'] });

export const componentUpdate = z.object({
	slug,
	name: text(60).min(1).optional(),
	description: text(200).optional(),
	paused: z.boolean().optional(),
	autoIncident: z.boolean().optional(),
	degradedLatencyMs: z.number().int().min(100).max(60_000).optional(),
	intervalSec: z.number().int().min(15).max(3600).optional()
});

export const probeNow = z.object({ slug: slug.optional() });

/** First readable validation message, for a 400 response. */
export function firstIssue(error: z.ZodError): string {
	const issue = error.issues[0];
	const path = issue.path.join('.');
	return path ? `${path}: ${issue.message}` : issue.message;
}
