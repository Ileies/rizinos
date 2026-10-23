// Pure status-page types and constants. No `$app` or `$db` imports so tests and the
// sibling `rizinos-status` prober can mirror them without pulling in the framework.

export const COMPONENT_STATES = [
	'operational',
	'degraded',
	'down',
	'maintenance',
	'unknown'
] as const;
export type ComponentState = (typeof COMPONENT_STATES)[number];

export const COMPONENT_GROUPS = ['platform', 'game', 'community'] as const;
export type ComponentGroup = (typeof COMPONENT_GROUPS)[number];

/** Raw outcome of one probe run, before the consecutive-failure rules are applied. */
export type CheckLevel = 'ok' | 'slow' | 'degraded' | 'fail';

export const OVERALL_STATES = [
	'operational',
	'degraded',
	'partial_outage',
	'major_outage',
	'maintenance',
	'unknown'
] as const;
export type OverallState = (typeof OVERALL_STATES)[number];

export const INCIDENT_STATUSES = ['investigating', 'identified', 'monitoring', 'resolved'] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export const INCIDENT_IMPACTS = ['minor', 'major', 'critical'] as const;
export type IncidentImpact = (typeof INCIDENT_IMPACTS)[number];

export type IncidentSource = 'auto' | 'manual';

export type MaintenancePhase = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

/** Components that, when down, turn the overall state into a major outage. */
export const CORE_COMPONENTS = ['api', 'database'] as const;

/** How many days of history the public page shows. */
export const HISTORY_DAYS = 90;

/** Probe data older than this is considered stale: the monitor itself is not running. */
export const HEARTBEAT_STALE_MS = 3 * 60_000;

export const LIMITS = {
	title: 140,
	body: 4000,
	description: 2000,
	components: 20
} as const;

export interface DayCell {
	/** UTC day, `YYYY-MM-DD`. */
	day: string;
	state: 'operational' | 'degraded' | 'down' | 'maintenance' | 'nodata';
	/** Share of non-maintenance samples that were not down, 0-100. `null` without data. */
	uptime: number | null;
	downMinutes: number;
	degradedMinutes: number;
}

export interface PublicComponent {
	slug: string;
	name: string;
	description: string;
	group: ComponentGroup;
	state: ComponentState;
	/** Since when the component has been in `state`. */
	since: string | null;
	uptime90: number | null;
	days: DayCell[];
}

export interface PublicIncidentUpdate {
	id: string;
	status: IncidentStatus;
	body: string;
	createdAt: string;
}

export interface PublicIncident {
	id: string;
	title: string;
	status: IncidentStatus;
	impact: IncidentImpact;
	components: string[];
	startedAt: string;
	resolvedAt: string | null;
	updates: PublicIncidentUpdate[];
}

export interface PublicMaintenance {
	id: string;
	title: string;
	description: string;
	phase: MaintenancePhase;
	startsAt: string;
	endsAt: string;
	components: string[];
}

export interface PublicStatus {
	generatedAt: string;
	monitor: { stale: boolean; lastBeatAt: string | null };
	overall: OverallState;
	components: PublicComponent[];
	incidents: PublicIncident[];
	history: PublicIncident[];
	maintenance: PublicMaintenance[];
	stats: { onlineUsers: number; version: string | null; runningSince: string };
}

export interface StatusBanner {
	overall: OverallState;
	incidents: Pick<PublicIncident, 'id' | 'title' | 'status' | 'impact'>[];
	maintenance: Pick<PublicMaintenance, 'id' | 'title' | 'phase' | 'startsAt' | 'endsAt'>[];
}

// ---------------------------------------------------------------------------
// Admin-only shapes (GET /api/admin/status). Never exposed on the public endpoints.
// ---------------------------------------------------------------------------

export interface AdminCheck {
	at: string;
	level: CheckLevel;
	state: ComponentState;
	latencyMs: number | null;
	error: string | null;
}

export interface AdminComponent extends PublicComponent {
	paused: boolean;
	autoIncident: boolean;
	degradedLatencyMs: number;
	intervalSec: number;
	/** State from probes alone, before maintenance and incident overrides. */
	probeState: ComponentState;
	failStreak: number;
	okStreak: number;
	slowStreak: number;
	lastCheckedAt: string | null;
	lastOkAt: string | null;
	lastLatencyMs: number | null;
	/** Details of the last run: sub-checks, error text, player count, ... */
	info: Record<string, unknown>;
	latency: {
		p50: number | null;
		p95: number | null;
		p99: number | null;
		/** Hourly buckets for the last 24 hours, oldest first. */
		series: { at: string; avg: number | null; fails: number }[];
	};
	recent: AdminCheck[];
}

export interface AdminIncident extends PublicIncident {
	source: IncidentSource;
	published: boolean;
	discordMessageId: string | null;
}

export interface AdminMaintenance extends PublicMaintenance {
	discordMessageId: string | null;
}

export interface AdminStatus {
	generatedAt: string;
	monitor: { stale: boolean; lastBeatAt: string | null; version: string | null };
	/** Host vitals reported by the prober (load, memory, disk, Postgres, services). */
	vitals: Record<string, unknown> | null;
	vitalsAt: string | null;
	components: AdminComponent[];
	incidents: AdminIncident[];
	maintenance: AdminMaintenance[];
	discordConfigured: boolean;
	probeRequestedAt: string | null;
}
