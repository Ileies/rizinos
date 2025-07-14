import os from '$lib/os.svelte';

/**
 * Sends a message to a specific app process
 * @param processId The ID of the process to send the message to
 * @param message The message to send
 * @returns Whether the message was sent successfully
 */
export function sendMessageToApp<T>(processId: number, message: AppMessage<T>): boolean {
	// Find the Window component for this process
	const windowElement = document.querySelector(`[data-pid="${processId}"]`) as HTMLElement | null;
	if (!windowElement) {
		console.error(`No window found for process ${processId}`);
		return false;
	}

	// Get the Window component instance
	const windowComponent = windowElement.__svelte;
	if (!windowComponent?.sendMessage) {
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
	os.processList.forEach(process => {
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
		.filter(process => process.appId === appId)
		.forEach(process => {
			sendMessageToApp(process.id, message);
		});
} 