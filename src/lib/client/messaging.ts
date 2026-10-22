import os from '#lib/os.svelte.js';

interface AppWindow {
	sendMessage(message: AppMessage): boolean;
}

const appWindows = new Map<number, AppWindow>();

export function registerAppWindow(processId: number, appWindow: AppWindow): () => void {
	appWindows.set(processId, appWindow);
	return () => {
		if (appWindows.get(processId) === appWindow) appWindows.delete(processId);
	};
}

/**
 * Sends a message to a specific app process
 * @param processId The ID of the process to send the message to
 * @param message The message to send
 * @returns Whether the message was sent successfully
 */
export function sendMessageToApp<T>(processId: number, message: AppMessage<T>): boolean {
	const windowComponent = appWindows.get(processId);
	if (!windowComponent) {
		console.error(`Window component for process ${processId} not found`);
		return false;
	}

	return windowComponent.sendMessage(message);
}

/**
 * Broadcasts a message to all running apps
 * @param message The message to broadcast
 */
export function broadcastToApps<T>(message: AppMessage<T>): void {
	os.processList.forEach((process) => {
		sendMessageToApp(process.id, message);
	});
}

/**
 * Sends a message to all instances of a specific app
 * @param appId The ID of the app to send the message to
 * @param message The message to send
 */
export function sendMessageToAppType<T>(appId: string, message: AppMessage<T>): void {
	os.processList
		.filter((process) => process.appId === appId)
		.forEach((process) => {
			sendMessageToApp(process.id, message);
		});
}
