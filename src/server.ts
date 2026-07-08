import { Server } from '../build/server/index.js';
import { manifest, base } from '../build/server/manifest.js';
import { handleWebSocketUpgrade, websocketHandlers } from '$lib/server/websocket';
import { join } from 'node:path';

const app = new Server(manifest);
await app.init({ env: process.env as Record<string, string> });

const clientDir = join(import.meta.dir, 'client' + base);

const server = Bun.serve({
	port: Bun.env.PORT ?? 3000,
	async fetch(req, server) {
		const url = new URL(req.url);

		if (url.pathname === '/ws') {
			return handleWebSocketUpgrade(req, server);
		}

		// Serve static client assets
		let pathname: string;
		try {
			pathname = decodeURIComponent(url.pathname);
		} catch {
			pathname = url.pathname;
		}

		const file = Bun.file(join(clientDir, pathname));
		if (await file.exists()) {
			const headers: HeadersInit = {};
			if (pathname.startsWith(`/${manifest.appPath}/immutable/`)) {
				headers['cache-control'] = 'public,max-age=31536000,immutable';
			}
			return new Response(file, { headers });
		}

		return app.respond(req, {
			getClientAddress: () =>
				req.headers.get('x-forwarded-for') ?? server.requestIP(req)?.address ?? '::1'
		});
	},
	websocket: {
		...websocketHandlers,
		// Detects unclean disconnects (crashes, network loss) via ping/pong so `close`
		// still fires and `isOnline`/`lastOnline` don't stay stuck.
		sendPings: true,
		idleTimeout: 30
	}
});

console.log(`Server running on http://localhost:${server.port}`);
