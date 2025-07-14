import { format } from 'date-fns';
import { db } from '$db';
import { logs } from '$db/schema';
import { LogLevel } from '$types';

/**
 * Logger for handling and storing log messages with different severity levels.
 * Logs are persisted to the database and printed to the console.
 */
const Logger = {
	/**
	 * Logs an informational message.
	 * @param message - Describes the event or operation.
	 * @param data - Additional context or details (optional).
	 */
	info(message: string, data?: unknown): void {
		void this.addLog(LogLevel.INFO, message, data);
	},

	/**
	 * Logs a warning message.
	 * @param message - Describes the event or issue.
	 * @param data - Additional context or details (optional).
	 */
	warn(message: string, data?: unknown): void {
		void this.addLog(LogLevel.WARNING, message, data);
	},

	/**
	 * Logs an error message.
	 * @param message - Describes the error or failure.
	 * @param data - Additional context or details (optional).
	 */
	error(message: string, data?: unknown): void {
		void this.addLog(LogLevel.ERROR, message, data);
	},

	/**
	 * Logs a debug message.
	 * @param message - Describes the event, often used during development.
	 * @param data - Additional context or details (optional).
	 */
	debug(message: string, data?: unknown): void {
		void this.addLog(LogLevel.DEBUG, message, data);
	},

	/**
	 * Internal method to handle log creation and persistence.
	 * @param type - The log level (severity) of the message.
	 * @param message - Describes the log entry.
	 * @param data - Optional additional context for the log.
	 */
	async addLog(type: LogLevel, message: string, data?: unknown): Promise<void> {
		const logEntry = {
			createdAt: new Date(),
			type,
			message,
			data: data ?? null // Using nullish coalescing operator instead of logical OR
		};

		// Save the log to the database
		await db.insert(logs).values(logEntry);

		// Format and output the log to the console
		const formattedDate = format(logEntry.createdAt, 'yyyy-MM-dd HH:mm:ss');
		console.log(`[${formattedDate}] [${type.toUpperCase()}]: ${message}`);
	}
};
export default Logger;