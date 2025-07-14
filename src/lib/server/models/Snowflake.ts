/**
 * The epoch timestamp from which Snowflake IDs are generated.
 * Represents January 1, 2021.
 */
export const epoch = 1609459200000;

/**
 * A class that generates unique Snowflake IDs.
 * The IDs are based on a combination of timestamp, data center ID, worker ID, and sequence number.
 */
export class Snowflake {
	private lastTimestamp = -1;
	private sequence = 0;

	/** Bitwise shift for the timestamp in the Snowflake ID. */
	static readonly timestampLeftShift = 22n;
	/** Bitwise shift for the data center ID in the Snowflake ID. */
	readonly dataCenterIdShift = 17n;
	/** Bitwise shift for the worker ID in the Snowflake ID. */
	readonly workerIdShift = 12n;
	/** Maximum value for the sequence number (2^12 - 1). */
	readonly sequenceMask = 4095;

	/**
	 * Creates a new instance of the Snowflake generator.
	 * @param dataCenterId - The data center ID (defaults to 0).
	 * @param workerId - The worker ID (defaults to 0).
	 */
	constructor(private dataCenterId = 0, private workerId = 0) {
	}

	/**
	 * Extracts the timestamp from a given Snowflake ID.
	 * @param snowflakeId - The Snowflake ID as a string.
	 * @returns {number} The extracted timestamp in milliseconds.
	 */
	static extractTimestamp(snowflakeId: string): number {
		const idBigInt = BigInt(snowflakeId);
		const timestamp = (idBigInt >> BigInt(Snowflake.timestampLeftShift)) + BigInt(epoch);
		return Number(timestamp);
	}

	/**
	 * Waits for the next millisecond if the current timestamp is not greater than the last timestamp.
	 * @param lastTimestamp - The last recorded timestamp.
	 * @returns {number} The next millisecond timestamp.
	 */
	tilNextMillis(lastTimestamp: number): number {
		let timestamp: number;
		do {
			timestamp = this.currentTimeMillis();
		} while (timestamp <= lastTimestamp);
		return timestamp;
	}

	/**
	 * Gets the current time in milliseconds since the Unix epoch.
	 * @returns {number} The current timestamp in milliseconds.
	 */
	currentTimeMillis(): number {
		return Date.now();
	}

	/**
	 * Generates the next unique Snowflake ID.
	 * @returns {string} A unique Snowflake ID as a string.
	 * @throws Will throw an error if the system clock moves backward.
	 */
	nextId(): string {
		let timestamp = this.currentTimeMillis();

		if (timestamp < this.lastTimestamp) {
			throw new Error('Clock moved backwards. Refusing to generate id');
		}

		if (this.lastTimestamp === timestamp) {
			this.sequence = (this.sequence + 1) & this.sequenceMask;
			if (this.sequence === 0) {
				timestamp = this.tilNextMillis(this.lastTimestamp);
			}
		} else {
			this.sequence = 0;
		}

		this.lastTimestamp = timestamp;

		return (BigInt(this.genId(timestamp)) | BigInt(this.sequence)).toString();
	}

	/**
	 * Generates the base Snowflake ID without the sequence part.
	 * @param timestamp - The current timestamp in milliseconds.
	 * @returns {bigint} The base Snowflake ID.
	 */
	genId(timestamp: number): bigint {
		const timePart = BigInt(timestamp - epoch) << Snowflake.timestampLeftShift;
		const dataCenterPart = BigInt(this.dataCenterId) << this.dataCenterIdShift;
		const workerPart = BigInt(this.workerId) << this.workerIdShift;

		return timePart | dataCenterPart | workerPart;
	}
}

/**
 * A default singleton instance of the Snowflake class.
 * Configured with default data center ID and worker ID of 0.
 */
const snowflake = new Snowflake();
export default snowflake;
