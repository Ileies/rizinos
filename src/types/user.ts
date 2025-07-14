import type { users } from '$db/schema';
import type { ID } from '$types';

export enum Role {
	User = 'user',
	Bot = 'bot',
	Admin = 'admin',
	Moderator = 'moderator',
	Developer = 'developer',
	Supporter = 'supporter',
	BetaTester = 'beta',
	Trusted = 'trusted',
}

export type UserID = ID;

/**
 * Can be negated with `!`
 *
 * Can be restricted to a role with `@`
 *
 * Can be restricted to a user with its ID
 */
export type Restrict = `@${Role}` | UserID | `!@${Role}` | `!${UserID}`;

export type UserData = Omit<typeof users.$inferInsert, 'passwordHash'> & {
	id: UserID;
	roles: Role[];
	credit: number;
};
