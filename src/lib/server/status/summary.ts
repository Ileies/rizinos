import {
	CORE_COMPONENTS,
	HISTORY_DAYS,
	type ComponentState,
	type DayCell,
	type IncidentImpact,
	type MaintenancePhase,
	type OverallState
} from './types';

const STATE_RANK: Record<ComponentState, number> = {
	operational: 0,
	unknown: 0,
	maintenance: 1,
	degraded: 2,
	down: 3
};

/** The more severe of two component states (`unknown` never wins over a known state). */
export function worseState(a: ComponentState, b: ComponentState): ComponentState {
	if (a === 'unknown') return b;
	if (b === 'unknown') return a;
	return STATE_RANK[b] > STATE_RANK[a] ? b : a;
}

export function impactToState(impact: IncidentImpact): ComponentState {
	return impact === 'minor' ? 'degraded' : 'down';
}

export function maintenancePhase(
	m: { startsAt: Date; endsAt: Date; cancelledAt: Date | null },
	now: Date
): MaintenancePhase {
	if (m.cancelledAt) return 'cancelled';
	if (now < m.startsAt) return 'scheduled';
	if (now < m.endsAt) return 'in_progress';
	return 'completed';
}

/**
 * What the page shows for one component: an active maintenance window wins (planned work
 * is not an outage), otherwise the worse of the probe state and any open incident.
 */
export function displayState(
	probe: ComponentState,
	opts: { inMaintenance: boolean; incidentImpacts: IncidentImpact[]; paused: boolean }
): ComponentState {
	if (opts.inMaintenance) return 'maintenance';
	if (opts.paused) return 'unknown';
	return opts.incidentImpacts.reduce<ComponentState>(
		(state, impact) => worseState(state, impactToState(impact)),
		probe
	);
}

/** Headline state for the whole platform. */
export function overallState(
	components: { slug: string; state: ComponentState }[],
	opts: { monitorStale: boolean }
): OverallState {
	const known = components.filter((c) => c.state !== 'unknown');
	if (opts.monitorStale || known.length === 0) return 'unknown';

	const down = known.filter((c) => c.state === 'down');
	if (down.length) {
		const coreDown = down.some((c) => (CORE_COMPONENTS as readonly string[]).includes(c.slug));
		return coreDown || down.length * 2 >= known.length ? 'major_outage' : 'partial_outage';
	}
	if (known.some((c) => c.state === 'degraded')) return 'degraded';
	if (known.some((c) => c.state === 'maintenance')) return 'maintenance';
	return 'operational';
}

export interface DailyRow {
	day: string;
	samples: number;
	degradedSamples: number;
	downSamples: number;
	maintenanceSamples: number;
}

const DAY_MS = 86_400_000;

export function utcDay(date: Date): string {
	return date.toISOString().slice(0, 10);
}

/** Share of measured (non-maintenance) samples that were not down. Degraded counts as up. */
export function uptimeOf(rows: Pick<DailyRow, 'samples' | 'downSamples' | 'maintenanceSamples'>[]) {
	let measured = 0;
	let down = 0;
	for (const r of rows) {
		measured += r.samples - r.maintenanceSamples;
		down += r.downSamples;
	}
	return measured > 0 ? Math.max(0, ((measured - down) / measured) * 100) : null;
}

/**
 * Expands sparse daily rows into one cell per day, oldest first, ending at `today`.
 * `intervalSec` converts sample counts into minutes.
 */
export function buildDays(
	rows: DailyRow[],
	today: Date,
	intervalSec: number,
	days = HISTORY_DAYS
): DayCell[] {
	const byDay = new Map(rows.map((r) => [r.day, r]));
	const minutesPerSample = intervalSec / 60;
	const cells: DayCell[] = [];

	for (let i = days - 1; i >= 0; i--) {
		const day = utcDay(new Date(today.getTime() - i * DAY_MS));
		const r = byDay.get(day);
		if (!r || r.samples === 0) {
			cells.push({ day, state: 'nodata', uptime: null, downMinutes: 0, degradedMinutes: 0 });
			continue;
		}

		const downMinutes = Math.round(r.downSamples * minutesPerSample);
		const degradedMinutes = Math.round(r.degradedSamples * minutesPerSample);
		const uptime = uptimeOf([r]);

		let state: DayCell['state'];
		if (r.maintenanceSamples === r.samples) state = 'maintenance';
		else if (downMinutes >= 5) state = 'down';
		else if (r.downSamples > 0 || degradedMinutes >= 5) state = 'degraded';
		else state = 'operational';

		cells.push({ day, state, uptime, downMinutes, degradedMinutes });
	}
	return cells;
}
