import {
	boolean,
	date,
	index,
	integer,
	jsonb,
	pgTable,
	primaryKey,
	text,
	timestamp
} from 'drizzle-orm/pg-core';
import { id } from './lib';
import { users } from './schemaUsers';
import type { UserID } from '$types/user';
import type {
	CheckLevel,
	ComponentGroup,
	ComponentState,
	IncidentImpact,
	IncidentSource,
	IncidentStatus
} from '../status/types';

// The `rizinos-status` prober owns the writes to `status_components` (probe state),
// `status_checks`, `status_daily` and `status_meta`. This backend owns the schema, the
// incident and maintenance tables, and the admin-editable component settings.
// See docs/status.md.

/** One monitored thing. Seeded by the prober, tuned from the admin dashboard. */
export const statusComponents = pgTable('status_components', {
	slug: text('slug').primaryKey(),
	name: text('name').notNull(),
	description: text('description').notNull().default(''),
	group: text('grp').notNull().$type<ComponentGroup>(),
	position: integer('position').notNull().default(0),
	/** Admin switch: a paused component is not probed and not shown as down. */
	paused: boolean('paused').notNull().default(false),
	/** Whether a failing probe opens a draft incident. Off for noisy or expected-offline components. */
	autoIncident: boolean('auto_incident').notNull().default(true),
	/** A probe slower than this counts as `slow` (and is compared against 3x the rolling baseline). */
	degradedLatencyMs: integer('degraded_latency_ms').notNull().default(3000),
	intervalSec: integer('interval_sec').notNull().default(60),

	// Probe state, written by the prober only.
	state: text('state').notNull().$type<ComponentState>().default('unknown'),
	stateSince: timestamp('state_since'),
	lastCheckedAt: timestamp('last_checked_at'),
	lastOkAt: timestamp('last_ok_at'),
	lastLatencyMs: integer('last_latency_ms'),
	failStreak: integer('fail_streak').notNull().default(0),
	okStreak: integer('ok_streak').notNull().default(0),
	slowStreak: integer('slow_streak').notNull().default(0),
	/** Admin-only details of the last run: sub-checks, error text, player count, ... */
	info: jsonb('info').notNull().$type<Record<string, unknown>>().default({})
});

/** Raw probe results. Kept for a few days, then only the daily rollup remains. */
export const statusChecks = pgTable(
	'status_checks',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
		component: text('component')
			.notNull()
			.references(() => statusComponents.slug, { onDelete: 'cascade' }),
		checkedAt: timestamp('checked_at').notNull().defaultNow(),
		/** Raw outcome of this single probe. */
		level: text('level').notNull().$type<CheckLevel>(),
		/** Component state after the consecutive-failure rules ran for this probe. */
		state: text('state').notNull().$type<ComponentState>(),
		latencyMs: integer('latency_ms'),
		error: text('error'),
		details: jsonb('details').notNull().$type<Record<string, unknown>>().default({}),
		/** A maintenance window covered the component. Excluded from uptime. */
		maintenance: boolean('maintenance').notNull().default(false)
	},
	(t) => [index('status_checks_component_time').on(t.component, t.checkedAt)]
);

/** One row per component and UTC day, rebuilt from `status_checks` and kept long term. */
export const statusDaily = pgTable(
	'status_daily',
	{
		component: text('component')
			.notNull()
			.references(() => statusComponents.slug, { onDelete: 'cascade' }),
		day: date('day', { mode: 'string' }).notNull(),
		samples: integer('samples').notNull().default(0),
		okSamples: integer('ok_samples').notNull().default(0),
		degradedSamples: integer('degraded_samples').notNull().default(0),
		downSamples: integer('down_samples').notNull().default(0),
		maintenanceSamples: integer('maintenance_samples').notNull().default(0),
		latencyAvgMs: integer('latency_avg_ms'),
		latencyP95Ms: integer('latency_p95_ms')
	},
	(t) => [primaryKey({ columns: [t.component, t.day] })]
);

/** Small key/value store: monitor heartbeat, server vitals, probe-now requests. */
export const statusMeta = pgTable('status_meta', {
	key: text('key').primaryKey(),
	value: jsonb('value').notNull().$type<Record<string, unknown>>().default({}),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const statusIncidents = pgTable('status_incidents', {
	id,
	title: text('title').notNull(),
	status: text('status').notNull().$type<IncidentStatus>().default('investigating'),
	impact: text('impact').notNull().$type<IncidentImpact>().default('minor'),
	source: text('source').notNull().$type<IncidentSource>().default('manual'),
	/** Drafts (auto-detected or not yet announced) are only visible to admins. */
	published: boolean('published').notNull().default(false),
	startedAt: timestamp('started_at').notNull().defaultNow(),
	resolvedAt: timestamp('resolved_at'),
	authorId: text('author_id')
		.references(() => users.id, { onDelete: 'set null' })
		.$type<UserID>(),
	/** Discord message that is edited in place as the incident develops. */
	discordMessageId: text('discord_message_id'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const statusIncidentComponents = pgTable(
	'status_incident_components',
	{
		incidentId: text('incident_id')
			.notNull()
			.references(() => statusIncidents.id, { onDelete: 'cascade' }),
		component: text('component')
			.notNull()
			.references(() => statusComponents.slug, { onDelete: 'cascade' })
	},
	(t) => [primaryKey({ columns: [t.incidentId, t.component] })]
);

export const statusIncidentUpdates = pgTable('status_incident_updates', {
	id,
	incidentId: text('incident_id')
		.notNull()
		.references(() => statusIncidents.id, { onDelete: 'cascade' }),
	status: text('status').notNull().$type<IncidentStatus>(),
	body: text('body').notNull(),
	authorId: text('author_id')
		.references(() => users.id, { onDelete: 'set null' })
		.$type<UserID>(),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export const statusMaintenance = pgTable('status_maintenance', {
	id,
	title: text('title').notNull(),
	description: text('description').notNull().default(''),
	startsAt: timestamp('starts_at').notNull(),
	endsAt: timestamp('ends_at').notNull(),
	cancelledAt: timestamp('cancelled_at'),
	authorId: text('author_id')
		.references(() => users.id, { onDelete: 'set null' })
		.$type<UserID>(),
	discordMessageId: text('discord_message_id'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const statusMaintenanceComponents = pgTable(
	'status_maintenance_components',
	{
		maintenanceId: text('maintenance_id')
			.notNull()
			.references(() => statusMaintenance.id, { onDelete: 'cascade' }),
		component: text('component')
			.notNull()
			.references(() => statusComponents.slug, { onDelete: 'cascade' })
	},
	(t) => [primaryKey({ columns: [t.maintenanceId, t.component] })]
);
