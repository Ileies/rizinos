/**
 * Handles financial transactions between users in the system.
 * Manages creation, retrieval, transfer of credits, and refund operations.
 */

import { eq } from 'drizzle-orm';
import {
	InsufficientFundsError,
	type TransactionData,
	TransactionError,
	TransactionStatus,
	TransactionType,
	type UserData
} from '$types';
import { db } from '$db';
import { transactions, users } from '$db/schema';
import { addCredit, getSystemUser, getUserById, isSystemUser } from '$lib/server/models/User';
import Logger from '$lib/server/models/Logger';

export default class Transaction {
	public readonly data: TransactionData;

	constructor(data: TransactionData) {
		if (data.amount <= 0) {
			throw new TransactionError('Transaction amount must be positive');
		}
		this.data = data;
	}

	/**
	 * Retrieves a transaction by its ID from the database.
	 * @throws {TransactionError} If database query fails
	 */
	static async get(id: string): Promise<Transaction | undefined> {
		try {
			const data = await db.query.transactions.findFirst({
				where: (transactions, { eq }) => eq(transactions.id, id)
			});
			return data ? new Transaction(data) : undefined;
		} catch (error) {
			Logger.error('Failed to retrieve transaction', { id, error });
			throw new TransactionError('Failed to retrieve transaction');
		}
	}

	/**
	 * Executes a credit transfer between two users within a database transaction.
	 * @throws {InsufficientFundsError} If sender has insufficient funds
	 * @throws {TransactionError} If transfer fails
	 */
	static async transfer(
		sender: UserData,
		receiver: UserData,
		amount: number,
		reason = '',
		type: TransactionType = TransactionType.Transfer
	): Promise<Transaction> {
		if (amount <= 0) {
			throw new TransactionError('Transaction amount must be positive');
		}

		// Validate basic conditions
		if (sender.id === receiver.id) {
			throw new TransactionError('Cannot transfer to self');
		}

		// Try to deduct from sender first - addCredit will return false if insufficient funds
		if (!isSystemUser(sender) && !addCredit(sender, -amount)) {
			throw new InsufficientFundsError();
		}

		// Add to receiver
		if (!isSystemUser(receiver)) {
			addCredit(receiver, amount);
		}

		try {
			return await db.transaction(async (tx) => {
				// Update both users' credits atomically
				const [senderUpdated] = isSystemUser(sender) ? [1] : await tx.update(users)
					.set({ credit: sender.credit })
					.where(eq(users.id, sender.id)).returning({ id: users.id });

				const [receiverUpdated] = isSystemUser(receiver) ? [1] : await tx.update(users)
					.set({ credit: receiver.credit })
					.where(eq(users.id, receiver.id)).returning({ id: users.id });

				if (!senderUpdated || !receiverUpdated) {
					throw new TransactionError('Failed to update user balances');
				}

				const transactionData = {
					senderId: sender.id,
					receiverId: receiver.id,
					amount,
					reason,
					type
				};

				const [transaction] = await tx.insert(transactions).values(transactionData).returning();

				if (!transaction) {
					Logger.error('Failed to create transaction record', transactionData);
					throw new TransactionError('Failed to create transaction record');
				}

				return new Transaction(transaction);
			});
		} catch (error) {
			// Revert the local credit changes since the transaction failed
			if (!isSystemUser(sender)) {
				addCredit(sender, amount);
			}
			if (!isSystemUser(receiver)) {
				addCredit(receiver, -amount);
			}

			Logger.error('Transfer failed', { sender: sender.id, receiver: receiver.id, amount, error });
			throw error instanceof TransactionError ? error : new TransactionError('Transfer failed');
		}
	}

	static purchase(payer: UserData, receiver: UserData, amount: number, reason = '') {
		return Transaction.transfer(payer, receiver, amount, reason, TransactionType.Purchase);
	}

	static async gift(user: UserData, amount: number, reason = '') {
		return await Transaction.transfer(await getSystemUser(), user, amount, reason, TransactionType.Gift);
	}

	/**
	 * Processes a refund for this transaction.
	 * @throws {TransactionError} If refund fails or is invalid
	 */
	async refund(reason = 'Refund'): Promise<Transaction> {
		if (this.data.status !== TransactionStatus.Completed || this.data.type === TransactionType.Refund) {
			throw new TransactionError('Transaction cannot be refunded');
		}

		const [sender, receiver] = await Promise.all([
			getUserById(this.data.senderId),
			getUserById(this.data.receiverId)
		]);

		if (!sender || !receiver) {
			throw new TransactionError('Failed to retrieve users for refund');
		}

		const refundTransaction = await Transaction.transfer(
			receiver,
			sender,
			this.data.amount,
			reason,
			TransactionType.Refund
		);

		const updated = (await db.update(transactions)
			.set({ status: TransactionStatus.Refunded })
			.where(eq(transactions.id, this.data.id)).returning({ id: transactions.id }))[0];

		if (!updated) {
			Logger.error('Refund failed', { transactionId: this.data.id });
			throw new TransactionError('Failed to update original transaction status');
		}

		return refundTransaction;
	}
}