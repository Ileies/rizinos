import { eq } from 'drizzle-orm';
import { type Restrict, Role, type Token, TokenType, type UserData, type UserID } from '$types';
import { db } from '$db';
import { tokens, users } from '$db/schema';
import crypto from 'crypto';
import { epoch } from '$lib/server/models/Snowflake';
import { addMonths } from 'date-fns';

export async function getUserByToken(token: string): Promise<UserData | undefined> {
	return db.query.tokens.findFirst({
		where: (tokens, { eq, and, gt }) => and(
			eq(tokens.token, token),
			eq(tokens.type, TokenType.Login),
			gt(tokens.expires, new Date()) // TODO: Testen, ob das so geprüft werden kann
		), columns: { userId: true }, with: {
			user: {
				columns: {
					passwordHash: false, isOnline: false
				}
			}
		}
	}).then(data => data?.user);
}

export async function getUserByEmail(email: string) {
	return db.query.users.findFirst({
		where: (users, { eq }) => eq(users.email, email),
		columns: { passwordHash: false, isOnline: false }
	});
}

/** Fetch a `User` from its ID */
export async function getUserById(id: UserID): Promise<UserData | undefined> {
	return db.query.users.findFirst({
		where: (users, { eq }) => eq(users.id, id), columns: {
			passwordHash: false, isOnline: false
		}
	});
}

// TODO: Maybe data has to be something else than undefined
export async function generateToken(userId: UserID, type: TokenType, expires: Date = addMonths(new Date(), 1), data: unknown = undefined): Promise<Token> {
	const timestamp = Math.floor((Date.now() - epoch) / 1000);
	const base64UserId = Buffer.from(userId).toString('base64url');
	const base64Timestamp = Buffer.from(timestamp.toString()).toString('base64url');
	const hmac = new Bun.CryptoHasher('sha256', process.env.SECRET ?? '');
	hmac.update(`${base64UserId}.${base64Timestamp}.${crypto.randomBytes(12)}`); // TODO: I'm probably destroying HMAC's purpose with these random bytes since they're not part of the payload
	const token = `${base64UserId}.${base64Timestamp}.${hmac.digest('base64url')}`;
	const tokenData: typeof tokens.$inferSelect = { token, userId, type, expires, data };
	await db.insert(tokens).values(tokenData);
	return tokenData;
}

/**
 * Add or subtract to a user's balance. Returns `false` if the user would have a negative balance after the operation
 * @param user The user to modify
 * @param amount The amount to add. Provide a negative value to subtract it.
 */
export function addCredit(user: UserData, amount: number): boolean {
	const newCredit = user.credit + amount;
	if (newCredit < 0) return false;
	user.credit = newCredit;
	return true;
}

export async function getSystemUser(): Promise<UserData> {
	const data = await db.query.users.findFirst({
		where: (users, { eq }) =>
			eq(users.username, 'system'), columns: { passwordHash: false, isOnline: false }
	});
	if (!data) throw new Error('System user not found');
	return data;
}

/** Check if the user has access to a resource */
export function canAccess(user: UserData, restrict: Restrict[]): boolean {
	let canAccess = false;
	let wasSet = false;
	for (let r of restrict) {
		const isForbidden = r.startsWith('!');
		if (isForbidden) r = r.slice(1) as Restrict;
		if (!r.startsWith('@')) {
			if (user.id === r) return !isForbidden;
		} else if (hasRole(user, r.slice(1) as Role) && !wasSet) {
			canAccess = !isForbidden;
			wasSet = true;
		}
	}
	return canAccess;
}

export function hasRole(user: UserData, role: Role): boolean {
	return user.roles.includes(role);
}

export async function getLastOnline(userId: UserID): Promise<Date | undefined> {
	return (await db.query.users.findFirst({
		where: (users, { eq }) => eq(users.id, userId), columns: { lastOnline: true }
	}))?.lastOnline;
}

export async function login(email: string, password: string): Promise<UserData | undefined> {
	const userData = await db.query.users.findFirst({
		where: (users, { eq }) => eq(users.email, email),
		columns: { isOnline: false }
	});
	if (!userData || !await Bun.password.verify(password, userData.passwordHash)) return;
	return userData;
}

export async function userAddRole(user: UserData, role: Role): Promise<void> {
	if (user.roles.includes(role)) return;
	await db.update(users).set({ roles: [...user.roles, role] }).where(eq(users.id, user.id));
	user.roles.push(role);
}

export async function removeRole(user: UserData, role: Role): Promise<void> {
	if (!user.roles.includes(role)) return;
	await db.update(users).set({ roles: user.roles.filter(r => r !== role) }).where(eq(users.id, user.id));
	user.roles = user.roles.filter(r => r !== role);
}

export async function isOnline(userId: UserID): Promise<boolean> {
	return (await db.query.users.findFirst({
		where: (users, { eq }) => eq(users.id, userId), columns: { isOnline: true }
	}))?.isOnline ?? false;
}

export function isSystemUser(user: UserData): boolean {
	return user.username === 'SYSTEM';
}

export async function setOnline(user: UserData, online: boolean): Promise<void> {
	const data: { isOnline: boolean, lastOnline?: Date } = { isOnline: online };
	if (!online) data.lastOnline = new Date();
	await db.update(users).set(data).where(eq(users.id, user.id));
}

export function getHighestRole(user: UserData): Role | null {
	for (const role of [Role.User, Role.Bot, Role.Admin, Role.Moderator, Role.Developer, Role.Supporter, Role.BetaTester]) {
		if (user.roles.includes(role)) return role;
	}
	return null;
}
