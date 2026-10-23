import { and, asc, count, desc, eq, gte, inArray, isNull, lt, or, sql } from 'drizzle-orm';
import { PUBLIC_VERSION } from '$app/env/public';
import { DISCORD_BOT_URL } from '$app/env/private';
import { db } from '$db';
import {
	statusChecks,
	statusComponents,
	statusDaily,
	statusIncidentComponents,
	statusIncidents,
	statusIncidentUpdates,
	statusMaintenance,
	statusMaintenanceComponents,
	statusMeta,
	users
} from '$db/schema';
import {
	buildDays,
	displayState,
	maintenancePhase,
	overallState,
	uptimeOf,
	utcDay,
	type DailyRow
} from './summary';
import {
	HEARTBEAT_STALE_MS,
	HISTORY_DAYS,
	type AdminIncident,
	type AdminMaintenance,
	type AdminStatus,
	type PublicComponent,
	type PublicIncident,
	type PublicMaintenance,
	type PublicStatus,
	type StatusBanner
} from './types';

const DAY_MS = 86_400_000;
const STARTED_AT = new Date(Date.now() - process.uptime() * 1000).toISOString();

/** Reads one `status_meta` row. */
export async function readMeta(key: string) {
	const [row] = await db.select().from(statusMeta).where(eq(statusMeta.key, key)).limit(1);
	return row ?? null;
}

export async function writeMeta(key: string, value: Record<string, unknown>) {
	await db
		.insert(statusMeta)
		.values({ key, value, updatedAt: new Date() })
		.onConflictDoUpdate({ target: statusMeta.key, set: { value, updatedAt: new Date() } });
}

// ---------------------------------------------------------------------------
// Incidents and maintenance (shared by the public and admin payloads)
// ---------------------------------------------------------------------------

async function loadIncidents(opts: {
	includeDrafts: boolean;
	now: Date;
}): Promise<AdminIncident[]> {
	const since = new Date(opts.now.getTime() - HISTORY_DAYS * DAY_MS);
	const visible = opts.includeDrafts ? undefined : eq(statusIncidents.published, true);
	const rows = await db
		.select()
		.from(statusIncidents)
		.where(
			and(visible, or(isNull(statusIncidents.resolvedAt), gte(statusIncidents.resolvedAt, since)))
		)
		.orderBy(desc(statusIncidents.startedAt))
		.limit(200);
	if (!rows.length) return [];

	const ids = rows.map((r) => r.id);
	const [links, updates] = await Promise.all([
		db
			.select()
			.from(statusIncidentComponents)
			.where(inArray(statusIncidentComponents.incidentId, ids)),
		db
			.select()
			.from(statusIncidentUpdates)
			.where(inArray(statusIncidentUpdates.incidentId, ids))
			.orderBy(desc(statusIncidentUpdates.createdAt))
	]);

	return rows.map((r) => ({
		id: r.id,
		title: r.title,
		status: r.status,
		impact: r.impact,
		source: r.source,
		published: r.published,
		discordMessageId: r.discordMessageId,
		components: links.filter((l) => l.incidentId === r.id).map((l) => l.component),
		startedAt: r.startedAt.toISOString(),
		resolvedAt: r.resolvedAt?.toISOString() ?? null,
		updates: updates
			.filter((u) => u.incidentId === r.id)
			.map((u) => ({
				id: u.id,
				status: u.status,
				body: u.body,
				createdAt: u.createdAt.toISOString()
			}))
	}));
}

async function loadMaintenance(opts: { admin: boolean; now: Date }): Promise<AdminMaintenance[]> {
	const from = new Date(opts.now.getTime() - (opts.admin ? 60 : 7) * DAY_MS);
	const rows = await db
		.select()
		.from(statusMaintenance)
		.where(
			and(
				gte(statusMaintenance.endsAt, from),
				opts.admin ? undefined : isNull(statusMaintenance.cancelledAt)
			)
		)
		.orderBy(asc(statusMaintenance.startsAt))
		.limit(100);
	if (!rows.length) return [];

	const links = await db
		.select()
		.from(statusMaintenanceComponents)
		.where(
			inArray(
				statusMaintenanceComponents.maintenanceId,
				rows.map((r) => r.id)
			)
		);

	return rows.map((r) => ({
		id: r.id,
		title: r.title,
		description: r.description,
		phase: maintenancePhase(r, opts.now),
		startsAt: r.startsAt.toISOString(),
		endsAt: r.endsAt.toISOString(),
		components: links.filter((l) => l.maintenanceId === r.id).map((l) => l.component),
		discordMessageId: r.discordMessageId
	}));
}

// Explicit field lists so admin-only columns can never leak into the public payload.
const toPublicIncident = (i: AdminIncident): PublicIncident => ({
	id: i.id,
	title: i.title,
	status: i.status,
	impact: i.impact,
	components: i.components,
	startedAt: i.startedAt,
	resolvedAt: i.resolvedAt,
	updates: i.updates
});
const toPublicMaintenance = (m: AdminMaintenance): PublicMaintenance => ({
	id: m.id,
	title: m.title,
	description: m.description,
	phase: m.phase,
	startsAt: m.startsAt,
	endsAt: m.endsAt,
	components: m.components
});

// ---------------------------------------------------------------------------
// Shared component assembly
// ---------------------------------------------------------------------------

async function loadComponentsBase(
	now: Date,
	incidents: AdminIncident[],
	maintenance: AdminMaintenance[]
) {
	const cutoff = utcDay(new Date(now.getTime() - (HISTORY_DAYS - 1) * DAY_MS));
	const [components, daily] = await Promise.all([
		db.select().from(statusComponents).orderBy(asc(statusComponents.position)),
		db.select().from(statusDaily).where(gte(statusDaily.day, cutoff))
	]);

	const active = maintenance.filter((m) => m.phase === 'in_progress');
	const open = incidents.filter((i) => i.published && i.status !== 'resolved');

	return components.map((c) => {
		const rows: DailyRow[] = daily.filter((d) => d.component === c.slug);
		const days = buildDays(rows, now, c.intervalSec);
		const state = displayState(c.state, {
			inMaintenance: active.some((m) => m.components.includes(c.slug)),
			incidentImpacts: open.filter((i) => i.components.includes(c.slug)).map((i) => i.impact),
			paused: c.paused
		});
		const pub: PublicComponent = {
			slug: c.slug,
			name: c.name,
			description: c.description,
			group: c.group,
			state,
			since: c.stateSince?.toISOString() ?? null,
			uptime90: uptimeOf(rows),
			days
		};
		return { row: c, pub };
	});
}

async function monitorHealth(now: Date) {
	const beat = await readMeta('heartbeat');
	const lastBeatAt = beat?.updatedAt ?? null;
	return {
		lastBeatAt: lastBeatAt?.toISOString() ?? null,
		stale: !lastBeatAt || now.getTime() - lastBeatAt.getTime() > HEARTBEAT_STALE_MS,
		version: typeof beat?.value.version === 'string' ? beat.value.version : null
	};
}

// ---------------------------------------------------------------------------
// Public payload
// ---------------------------------------------------------------------------

let publicCache: { at: number; promise: Promise<PublicStatus> } | null = null;
const PUBLIC_TTL_MS = 5_000;

/** Public status. Memoised for a few seconds so a spike of viewers costs one set of queries. */
export function loadPublicStatus(): Promise<PublicStatus> {
	if (publicCache && Date.now() - publicCache.at < PUBLIC_TTL_MS) return publicCache.promise;
	const promise = buildPublicStatus();
	publicCache = { at: Date.now(), promise };
	promise.catch(() => {
		if (publicCache?.promise === promise) publicCache = null;
	});
	return promise;
}

/** Drops the memoised public payload, e.g. after an admin posted an incident. */
export function invalidatePublicStatus() {
	publicCache = null;
}

async function buildPublicStatus(): Promise<PublicStatus> {
	const now = new Date();
	const [incidents, maintenance, monitor, [{ value: onlineUsers }]] = await Promise.all([
		loadIncidents({ includeDrafts: false, now }),
		loadMaintenance({ admin: false, now }),
		monitorHealth(now),
		db.select({ value: count() }).from(users).where(eq(users.isOnline, true))
	]);
	const components = await loadComponentsBase(now, incidents, maintenance);
	const pub = components.map((c) => c.pub);

	return {
		generatedAt: now.toISOString(),
		monitor: { stale: monitor.stale, lastBeatAt: monitor.lastBeatAt },
		overall: overallState(pub, { monitorStale: monitor.stale }),
		components: pub,
		incidents: incidents.filter((i) => i.status !== 'resolved').map(toPublicIncident),
		history: incidents.filter((i) => i.status === 'resolved').map(toPublicIncident),
		maintenance: maintenance.filter((m) => m.phase !== 'cancelled').map(toPublicMaintenance),
		stats: { onlineUsers, version: PUBLIC_VERSION ?? null, runningSince: STARTED_AT }
	};
}

/** Small payload for the site-wide and in-OS banners. */
export async function loadStatusBanner(): Promise<StatusBanner> {
	const status = await loadPublicStatus();
	const soon = Date.now() + DAY_MS;
	return {
		overall: status.overall,
		incidents: status.incidents.map(({ id, title, status, impact }) => ({
			id,
			title,
			status,
			impact
		})),
		maintenance: status.maintenance
			.filter(
				(m) =>
					m.phase === 'in_progress' || (m.phase === 'scheduled' && Date.parse(m.startsAt) < soon)
			)
			.map(({ id, title, phase, startsAt, endsAt }) => ({ id, title, phase, startsAt, endsAt }))
	};
}

// ---------------------------------------------------------------------------
// Admin payload
// ---------------------------------------------------------------------------

export async function loadAdminStatus(): Promise<AdminStatus> {
	const now = new Date();
	const dayAgo = new Date(now.getTime() - DAY_MS);
	const hourAgo = new Date(now.getTime() - 3_600_000);

	const hour = sql<string>`date_trunc('hour', ${statusChecks.checkedAt})`;
	const [incidents, maintenance, monitor, vitals, probeRequest, series, percentiles, recent] =
		await Promise.all([
			loadIncidents({ includeDrafts: true, now }),
			loadMaintenance({ admin: true, now }),
			monitorHealth(now),
			readMeta('vitals'),
			readMeta('probeRequest'),
			db
				.select({
					component: statusChecks.component,
					hour,
					avg: sql<number | null>`round(avg(${statusChecks.latencyMs}))::int`,
					fails: sql<number>`count(*) filter (where ${statusChecks.level} = 'fail')::int`
				})
				.from(statusChecks)
				.where(gte(statusChecks.checkedAt, dayAgo))
				.groupBy(statusChecks.component, hour)
				.orderBy(asc(hour)),
			db
				.select({
					component: statusChecks.component,
					p50: sql<
						number | null
					>`round(percentile_cont(0.5) within group (order by ${statusChecks.latencyMs}))::int`,
					p95: sql<
						number | null
					>`round(percentile_cont(0.95) within group (order by ${statusChecks.latencyMs}))::int`,
					p99: sql<
						number | null
					>`round(percentile_cont(0.99) within group (order by ${statusChecks.latencyMs}))::int`
				})
				.from(statusChecks)
				.where(and(gte(statusChecks.checkedAt, dayAgo), lt(statusChecks.latencyMs, 600_000)))
				.groupBy(statusChecks.component),
			db
				.select()
				.from(statusChecks)
				.where(gte(statusChecks.checkedAt, hourAgo))
				.orderBy(desc(statusChecks.checkedAt))
				.limit(1500)
		]);
	const base = await loadComponentsBase(now, incidents, maintenance);

	return {
		generatedAt: now.toISOString(),
		monitor,
		vitals: vitals?.value ?? null,
		vitalsAt: vitals?.updatedAt.toISOString() ?? null,
		components: base.map(({ row, pub }) => {
			const p = percentiles.find((x) => x.component === row.slug);
			return {
				...pub,
				paused: row.paused,
				autoIncident: row.autoIncident,
				degradedLatencyMs: row.degradedLatencyMs,
				intervalSec: row.intervalSec,
				probeState: row.state,
				failStreak: row.failStreak,
				okStreak: row.okStreak,
				slowStreak: row.slowStreak,
				lastCheckedAt: row.lastCheckedAt?.toISOString() ?? null,
				lastOkAt: row.lastOkAt?.toISOString() ?? null,
				lastLatencyMs: row.lastLatencyMs,
				info: row.info,
				latency: {
					p50: p?.p50 ?? null,
					p95: p?.p95 ?? null,
					p99: p?.p99 ?? null,
					series: series
						.filter((s) => s.component === row.slug)
						.map((s) => ({ at: new Date(s.hour).toISOString(), avg: s.avg, fails: s.fails }))
				},
				recent: recent
					.filter((r) => r.component === row.slug)
					.slice(0, 30)
					.map((r) => ({
						at: r.checkedAt.toISOString(),
						level: r.level,
						state: r.state,
						latencyMs: r.latencyMs,
						error: r.error
					}))
			};
		}),
		incidents,
		maintenance,
		discordConfigured: !!DISCORD_BOT_URL,
		probeRequestedAt: probeRequest?.updatedAt.toISOString() ?? null
	};
}
