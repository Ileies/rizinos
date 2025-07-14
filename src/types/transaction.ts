import type { transactions } from '$db/schemaUsers';

export enum TransactionStatus {
	Completed = 'completed',
	Failed = 'failed',
	Refunded = 'refunded'
}

export enum TransactionType {
	Transfer = 'transfer',
	Purchase = 'purchase',
	Refund = 'refund',
	Gift = 'gift'
}

// Custom error classes for better error handling
export class InsufficientFundsError extends Error {
	constructor(message = 'Insufficient funds for transaction') {
		super(message);
		this.name = 'InsufficientFundsError';
	}
}

export class TransactionError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'TransactionError';
	}
}

export type TransactionData = typeof transactions.$inferSelect;
