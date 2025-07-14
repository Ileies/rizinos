import type { tokens } from '$db/schema';

/**
 * Enum representing different types of tokens used in the system.
 */
export enum TokenType {
	/** Session identification */
	Login = 'login',
	/** API identification */
	Api = 'api',
	/** Password reset */
	Reset = 'reset',
	/** Device identification */
	Device = 'device',
	/** Email verification */
	Verify = 'verify',
	/** Discord verification */
	Discord = 'discord',
	/** Minecraft verification */
	Minecraft = 'minecraft',
}

/**
 * Interface defining the structure of token data required for creation
 */
export type Token = typeof tokens.$inferInsert & {
	expires: Date;
};
