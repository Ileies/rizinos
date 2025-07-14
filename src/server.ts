import { handler } from '../build/handler.js';
import { handleWebSocketUpgrade, websocketHandlers } from '$lib/server/websocket';

const server = Bun.serve({
	port: Bun.env.PORT ?? 3000,
	async fetch(req, server) {
		if (req.url.endsWith('/ws')) {
			return handleWebSocketUpgrade(req, server);
		}
		try {
			return await handler(req, server, {}) as Response;
		} catch (error) {
			console.error('Handler error:', error);
			return new Response('Internal Server Error', { status: 500 });
		}
	},
	websocket: websocketHandlers
});

console.log(`Server running on http://localhost:${server.port}`);
