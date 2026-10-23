import { expect, mock, test } from 'bun:test';
import { resolveProductionDatabase } from '../scripts/with-production-db';

const direct = 'postgres://postgres@192.168.10.85:5432/rizinos';
const tunnel = 'postgres://postgres@127.0.0.1:15432/rizinos';

test('prefers the direct database and does not open SSH', async () => {
	const probe = mock<(url: string) => Promise<boolean>>(async () => true);
	const runSsh = mock(async () => {});
	expect(await resolveProductionDatabase({ probe, runSsh })).toBe(direct);
	expect(probe.mock.calls).toEqual([[direct]]);
	expect(runSsh).not.toHaveBeenCalled();
});

test('reuses an existing tunnel when the direct database fails', async () => {
	const probe = mock(async (url: string) => url === tunnel);
	const runSsh = mock(async () => {});
	expect(await resolveProductionDatabase({ probe, runSsh })).toBe(tunnel);
	expect(probe.mock.calls).toEqual([[direct], [tunnel]]);
	expect(runSsh).not.toHaveBeenCalled();
});

test('opens SSH only after both endpoints fail and verifies the new tunnel', async () => {
	const events: string[] = [];
	const probe = mock(async (url: string) => {
		events.push(url);
		return events.length === 4;
	});
	const runSsh = mock<(args: string[]) => Promise<void>>(async () => {
		events.push('ssh');
	});
	expect(await resolveProductionDatabase({ probe, runSsh })).toBe(tunnel);
	expect(events).toEqual([direct, tunnel, 'ssh', tunnel]);
	expect(runSsh.mock.calls).toEqual([
		[
			[
				'-f',
				'-N',
				'-o',
				'ExitOnForwardFailure=yes',
				'-o',
				'ServerAliveInterval=30',
				'-L',
				'15432:127.0.0.1:5432',
				'ros'
			]
		]
	]);
});

test('stops when SSH fails', async () => {
	const probe = mock<(url: string) => Promise<boolean>>(async () => false);
	const runSsh = mock(async () => {
		throw new Error('SSH failed');
	});
	await expect(resolveProductionDatabase({ probe, runSsh })).rejects.toThrow('SSH failed');
	expect(probe).toHaveBeenCalledTimes(2);
});

test('fails when PostgreSQL remains unavailable after SSH succeeds', async () => {
	const probe = mock<(url: string) => Promise<boolean>>(async () => false);
	const runSsh = mock(async () => {});
	await expect(resolveProductionDatabase({ probe, runSsh })).rejects.toThrow(
		'PostgreSQL is unavailable at 127.0.0.1:15432'
	);
	expect(probe.mock.calls).toEqual([[direct], [tunnel], [tunnel]]);
});
