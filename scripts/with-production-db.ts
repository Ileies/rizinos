import postgres from 'postgres';

const directUrl = 'postgres://postgres@192.168.10.85:5432/rizinos';
const tunnelUrl = 'postgres://postgres@127.0.0.1:15432/rizinos';

async function probe(url: string): Promise<boolean> {
	const sql = postgres(url, { connect_timeout: 3, max: 1 });
	try {
		await sql`SELECT 1`;
		return true;
	} catch {
		return false;
	} finally {
		await sql.end({ timeout: 0 });
	}
}

async function runSsh(args: string[]): Promise<void> {
	const child = Bun.spawn(['ssh', ...args], {
		stdin: 'inherit',
		stdout: 'inherit',
		stderr: 'inherit'
	});
	const code = await child.exited;
	if (code !== 0) throw new Error(`Database SSH tunnel failed (exit ${code}).`);
}

/** Resolve a working production database URL, opening a persistent SSH tunnel if needed. */
export async function resolveProductionDatabase(dependencies = { probe, runSsh }): Promise<string> {
	if (await dependencies.probe(directUrl)) return directUrl;
	if (await dependencies.probe(tunnelUrl)) return tunnelUrl;

	await dependencies.runSsh([
		'-f',
		'-N',
		'-o',
		'ExitOnForwardFailure=yes',
		'-o',
		'ServerAliveInterval=30',
		'-L',
		'15432:127.0.0.1:5432',
		'ros'
	]);
	if (!(await dependencies.probe(tunnelUrl))) {
		throw new Error('SSH tunnel opened, but PostgreSQL is unavailable at 127.0.0.1:15432.');
	}
	return tunnelUrl;
}

if (import.meta.main) {
	try {
		const command = Bun.argv.slice(2);
		if (command.length === 0) {
			throw new Error('Usage: bun scripts/with-production-db.ts <command> [args...]');
		}
		const url = await resolveProductionDatabase();
		console.error(`Using production database at ${new URL(url).host}`);
		const child = Bun.spawn(command, {
			env: { ...process.env, NODE_ENV: 'production', DATABASE_URL: url },
			stdin: 'inherit',
			stdout: 'inherit',
			stderr: 'inherit'
		});
		process.exitCode = await child.exited;
	} catch (error) {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	}
}
