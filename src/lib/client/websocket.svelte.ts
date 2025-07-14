import { PUBLIC_ORIGIN } from '$env/static/public';
import os from '$lib/os.svelte';
import { dev } from '$app/environment';
import type { WebsocketMessage } from '$types';

export const wsMessage: { value: WebsocketMessage | null } = $state({ value: null });

export function sendWs(data: WebsocketMessage) {
	if (os.isOnline) ws.send(JSON.stringify(data));
}

let ws: WebSocket;

function connect() {
	if (!navigator.onLine) {
		setTimeout(connect, 1000);
		return;
	}

	ws = new WebSocket(`ws://${dev ? 'localhost' : PUBLIC_ORIGIN}:9998/ws`);

	ws.addEventListener('open', () => {
		os.isOnline = true;
	});

	ws.addEventListener('close', () => {
		os.isOnline = false;
		setTimeout(connect, 1000);
	});

	ws.addEventListener('message', (event) => {
		try {
			const message: WebsocketMessage = JSON.parse(event.data);
			if (message.action === 'startup') {
				console.log('Connected to WebSocket', message.data);
				return;
			}
			wsMessage.value = message;
		} catch (e) {
			console.error(e);
		}
	});
}

connect();
