import { EventEmitter } from 'events';

/**
 * A class for handling process signals and standard input events using an event-driven approach.
 */
export class ProcessHandler {
	/** The internal event emitter used to manage custom events. */
	private eventHandler: EventEmitter;

	/**
	 * Initializes the ProcessHandler.
	 * Sets the timezone to UTC, sets up signal listeners for termination events, and initializes the event emitter.
	 */
	constructor() {
		this.eventHandler = new EventEmitter();

		// Set the timezone to UTC
		process.env.TZ = 'UTC';

		// Listen for termination signals and emit a custom 'terminate' event
		process.on('SIGINT', () => this.eventHandler.emit('terminate'));
		process.on('SIGTERM', () => this.eventHandler.emit('terminate'));
	}

	/**
	 * Resumes standard input processing and listens for data input.
	 * Emits a 'data' event whenever input is received, passing the trimmed input as the event data.
	 */
	resumeInput(): void {
		process.stdin.resume();
		process.stdin.setEncoding('utf8');
		process.stdin.on('data', (data) => this.eventHandler.emit('data', data.toString().trim()));
	}

	/**
	 * Registers a callback function for a specific event.
	 * @param event - The name of the event to listen for (e.g., 'terminate', 'data').
	 * @param callback - The function to execute when the event is emitted.
	 */
	on(event: string, callback: (...args: unknown[]) => void): void {
		this.eventHandler.on(event, callback);
	}
}

/**
 * A singleton instance of the ProcessHandler class.
 * This instance is pre-configured to handle process signals and input events.
 */
const processHandler = new ProcessHandler();
export default processHandler;
