import { describe, expect, test } from 'bun:test';
import {
	buildDays,
	displayState,
	maintenancePhase,
	overallState,
	uptimeOf,
	worseState
} from '../src/lib/server/status/summary';
import * as v from '../src/lib/server/status/validate';

const NOW = new Date('2026-10-23T12:00:00Z');

describe('worseState', () => {
	test('ranks down above degraded above maintenance', () => {
		expect(worseState('degraded', 'down')).toBe('down');
		expect(worseState('maintenance', 'degraded')).toBe('degraded');
		expect(worseState('operational', 'maintenance')).toBe('maintenance');
	});

	test('unknown never hides a known state', () => {
		expect(worseState('unknown', 'operational')).toBe('operational');
		expect(worseState('down', 'unknown')).toBe('down');
	});
});

describe('displayState', () => {
	const base = { inMaintenance: false, incidentImpacts: [], paused: false } as const;

	test('probe state passes through', () => {
		expect(displayState('degraded', { ...base, incidentImpacts: [] })).toBe('degraded');
	});

	test('maintenance wins over a failing probe', () => {
		expect(displayState('down', { ...base, inMaintenance: true })).toBe('maintenance');
	});

	test('a major incident turns an operational probe into down', () => {
		expect(displayState('operational', { ...base, incidentImpacts: ['major'] })).toBe('down');
		expect(displayState('operational', { ...base, incidentImpacts: ['minor'] })).toBe('degraded');
	});

	test('paused components are unknown', () => {
		expect(displayState('operational', { ...base, paused: true })).toBe('unknown');
	});
});

describe('overallState', () => {
	const c = (slug: string, state: Parameters<typeof worseState>[0]) => ({ slug, state });

	test('all operational', () => {
		expect(
			overallState([c('api', 'operational'), c('web', 'operational')], { monitorStale: false })
		).toBe('operational');
	});

	test('a stale monitor is unknown, never green', () => {
		expect(overallState([c('api', 'operational')], { monitorStale: true })).toBe('unknown');
	});

	test('a core component down is a major outage', () => {
		const list = [
			c('api', 'down'),
			c('a', 'operational'),
			c('b', 'operational'),
			c('d', 'operational')
		];
		expect(overallState(list, { monitorStale: false })).toBe('major_outage');
	});

	test('a minor component down is a partial outage', () => {
		const list = [
			c('minecraft', 'down'),
			c('a', 'operational'),
			c('b', 'operational'),
			c('d', 'operational')
		];
		expect(overallState(list, { monitorStale: false })).toBe('partial_outage');
	});

	test('degraded beats maintenance', () => {
		expect(overallState([c('a', 'maintenance'), c('b', 'degraded')], { monitorStale: false })).toBe(
			'degraded'
		);
	});

	test('unknown components are ignored', () => {
		expect(overallState([c('a', 'unknown'), c('b', 'operational')], { monitorStale: false })).toBe(
			'operational'
		);
	});
});

describe('uptime and day cells', () => {
	test('maintenance samples are excluded and degraded counts as up', () => {
		expect(uptimeOf([{ samples: 100, downSamples: 10, maintenanceSamples: 20 }])).toBeCloseTo(87.5);
		expect(uptimeOf([{ samples: 10, downSamples: 0, maintenanceSamples: 10 }])).toBeNull();
	});

	test('buildDays returns one cell per day ending today', () => {
		const days = buildDays([], NOW, 60, 90);
		expect(days).toHaveLength(90);
		expect(days.at(-1)?.day).toBe('2026-10-23');
		expect(days[0].day).toBe('2026-07-26');
		expect(days.every((d) => d.state === 'nodata')).toBe(true);
	});

	test('classifies days by downtime', () => {
		const days = buildDays(
			[
				{
					day: '2026-10-23',
					samples: 600,
					degradedSamples: 0,
					downSamples: 0,
					maintenanceSamples: 0
				},
				{
					day: '2026-10-22',
					samples: 1440,
					degradedSamples: 0,
					downSamples: 30,
					maintenanceSamples: 0
				},
				{
					day: '2026-10-21',
					samples: 1440,
					degradedSamples: 0,
					downSamples: 3,
					maintenanceSamples: 0
				},
				{
					day: '2026-10-20',
					samples: 1440,
					degradedSamples: 12,
					downSamples: 0,
					maintenanceSamples: 0
				},
				{
					day: '2026-10-19',
					samples: 60,
					degradedSamples: 0,
					downSamples: 0,
					maintenanceSamples: 60
				}
			],
			NOW,
			60
		);
		const state = (day: string) => days.find((d) => d.day === day)?.state;
		expect(state('2026-10-23')).toBe('operational');
		expect(state('2026-10-22')).toBe('down');
		expect(state('2026-10-21')).toBe('degraded');
		expect(state('2026-10-20')).toBe('degraded');
		expect(state('2026-10-19')).toBe('maintenance');
	});

	test('sample counts scale by probe interval', () => {
		const [day] = buildDays(
			[
				{
					day: '2026-10-23',
					samples: 10,
					degradedSamples: 0,
					downSamples: 2,
					maintenanceSamples: 0
				}
			],
			NOW,
			300,
			1
		);
		expect(day.downMinutes).toBe(10);
	});
});

describe('maintenancePhase', () => {
	const window = {
		startsAt: new Date('2026-10-23T13:00:00Z'),
		endsAt: new Date('2026-10-23T14:00:00Z')
	};

	test('derives the phase from the clock', () => {
		expect(maintenancePhase({ ...window, cancelledAt: null }, NOW)).toBe('scheduled');
		expect(
			maintenancePhase({ ...window, cancelledAt: null }, new Date('2026-10-23T13:30:00Z'))
		).toBe('in_progress');
		expect(
			maintenancePhase({ ...window, cancelledAt: null }, new Date('2026-10-23T15:00:00Z'))
		).toBe('completed');
		expect(maintenancePhase({ ...window, cancelledAt: NOW }, NOW)).toBe('cancelled');
	});
});

describe('validation', () => {
	test('incident create applies defaults', () => {
		const parsed = v.incidentCreate.parse({
			title: 'API errors',
			components: ['api'],
			body: 'Looking into it'
		});
		expect(parsed.status).toBe('investigating');
		expect(parsed.impact).toBe('minor');
		expect(parsed.publish).toBe(true);
	});

	test('rejects bad slugs and short titles', () => {
		expect(() => v.incidentCreate.parse({ title: 'x', components: [], body: 'abc' })).toThrow();
		expect(() =>
			v.incidentCreate.parse({ title: 'Valid title', components: ['Bad Slug'], body: 'abc' })
		).toThrow();
	});

	test('maintenance end must be after start', () => {
		const base = { title: 'Database upgrade', components: ['database'] };
		expect(() =>
			v.maintenanceCreate.parse({
				...base,
				startsAt: '2026-10-24T10:00:00Z',
				endsAt: '2026-10-24T09:00:00Z'
			})
		).toThrow();
		const ok = v.maintenanceCreate.parse({
			...base,
			startsAt: '2026-10-24T10:00:00Z',
			endsAt: '2026-10-24T11:00:00Z'
		});
		expect(ok.startsAt).toBeInstanceOf(Date);
	});

	test('component update bounds', () => {
		expect(() => v.componentUpdate.parse({ slug: 'api', intervalSec: 1 })).toThrow();
		expect(v.componentUpdate.parse({ slug: 'api', paused: true }).paused).toBe(true);
	});
});
