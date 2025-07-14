import type { WebsocketData, WebsocketMessage } from '$types';
import { getUserByToken } from '$lib/server/models/User';
import { getDeviceByToken } from '$lib/server/models/device';
import { users } from '$db/schema';
import { eq } from 'drizzle-orm';
import type { Server, ServerWebSocket } from 'bun';
import { db } from '$db';

export async function handleWebSocketUpgrade(req: Request, server: Server) {
	const cookies = req.headers.get('Cookie')?.split('; ');
	if (!cookies) return new Response('Upgrade failed: No cookies', { status: 500 });
	const loginToken = cookies.find((c) => c.startsWith('loginToken='))?.split('=')[1];
	const deviceToken = cookies.find((c) => c.startsWith('deviceToken='))?.split('=')[1];
	if (!loginToken || !deviceToken) return new Response('Upgrade failed: No login token', { status: 500 });
	const device = await getDeviceByToken(deviceToken);
	const user = await getUserByToken(loginToken);
	if (!user || !device) return new Response('Upgrade failed: No user or device', { status: 500 });
	const ok = server.upgrade(req, { data: { user, device } as WebsocketData });
	if (ok) return;
	return new Response('Upgrade failed', { status: 500 });
}

export const websocketHandlers = {
	async open(ws: ServerWebSocket<WebsocketData>) {
		console.log(`WebSocket connected with user ${ws.data.user.username} on device ${ws.data.device.deviceToken}`);
		await db.update(users).set({
			isOnline: true,
			lastOnline: new Date()
		}).where(eq(users.id, ws.data.user.id));
		ws.send(JSON.stringify({
			action: 'startup',
			data: {}
		}));
	},

	message(ws: ServerWebSocket<WebsocketData>, message: string | Uint8Array) {
		const sendWs = (json: WebsocketMessage) => ws.send(JSON.stringify(json));

		try {
			const json = JSON.parse(message.toString() + '   ' + ws.data.user.username) as WebsocketMessage;
			sendWs({ action: 'echo', data: json });
		} catch (e) {
			console.error('Invalid JSON', e);
		}

		return;
	},

	async close(ws: ServerWebSocket<WebsocketData>, code: number, message: string) {
		await db.update(users).set({
			isOnline: false,
			lastOnline: new Date()
		}).where(eq(users.id, ws.data.user.id));
		console.log(`WebSocket closed with user ${ws.data.user.username} on device ${ws.data.device.deviceToken}`, code, message);
	}
}; 