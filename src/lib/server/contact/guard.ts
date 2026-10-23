/**
 * Abuse protection for the public contact endpoint: a signed time-trap challenge (single use,
 * must be at least MIN_AGE_MS old) and in-memory sliding-window rate limits.
 *
 * Both are per-process and reset on restart. That is acceptable here: the challenge only has to
 * stop naive bots, and a restart merely makes open forms fetch a fresh challenge.
 */

const MIN_AGE_MS = 3_000;
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

const key = crypto.getRandomValues(new Uint8Array(32));
let hmacKey: Promise<CryptoKey> | null = null;

function getKey(): Promise<CryptoKey> {
	hmacKey ??= crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, [
		'sign',
		'verify'
	]);
	return hmacKey;
}

function toBase64Url(bytes: Uint8Array): string {
	return Buffer.from(bytes).toString('base64url');
}

async function sign(payload: string): Promise<string> {
	const sig = await crypto.subtle.sign('HMAC', await getKey(), new TextEncoder().encode(payload));
	return toBase64Url(new Uint8Array(sig));
}

const usedNonces = new Map<string, number>();

function pruneNonces(now: number) {
	for (const [nonce, expires] of usedNonces) if (expires <= now) usedNonces.delete(nonce);
}

export type ChallengeResult = 'ok' | 'invalid' | 'too_fast' | 'expired' | 'replayed';

/** Issues a token the form must send back with its submission. */
export async function issueChallenge(now = Date.now()): Promise<string> {
	const nonce = toBase64Url(crypto.getRandomValues(new Uint8Array(12)));
	const payload = `${now}.${nonce}`;
	return `${payload}.${await sign(payload)}`;
}

/** Verifies the token and burns its nonce so it cannot be replayed. */
export async function verifyChallenge(token: unknown, now = Date.now()): Promise<ChallengeResult> {
	if (typeof token !== 'string') return 'invalid';
	const parts = token.split('.');
	if (parts.length !== 3) return 'invalid';
	const [issuedStr, nonce, signature] = parts;
	const issued = Number(issuedStr);
	if (!Number.isFinite(issued) || !nonce || !signature) return 'invalid';

	const expected = await sign(`${issuedStr}.${nonce}`);
	if (expected.length !== signature.length) return 'invalid';
	let diff = 0;
	for (let i = 0; i < expected.length; i++)
		diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
	if (diff !== 0) return 'invalid';

	if (now - issued > MAX_AGE_MS) return 'expired';
	if (now - issued < MIN_AGE_MS) return 'too_fast';

	pruneNonces(now);
	if (usedNonces.has(nonce)) return 'replayed';
	usedNonces.set(nonce, issued + MAX_AGE_MS);
	return 'ok';
}

export interface LimitResult {
	ok: boolean;
	/** Seconds until another attempt can succeed. Only set when `ok` is false. */
	retryAfter?: number;
}

/** Sliding-window counter keyed by an arbitrary string (IP, email, ...). */
export class RateLimiter {
	private hits = new Map<string, number[]>();

	constructor(
		readonly limit: number,
		readonly windowMs: number
	) {}

	/** Would a hit be allowed right now? Does not record anything. */
	peek(id: string, now = Date.now()): LimitResult {
		const recent = (this.hits.get(id) ?? []).filter((t) => now - t < this.windowMs);
		if (recent.length < this.limit) return { ok: true };
		return { ok: false, retryAfter: Math.ceil((recent[0] + this.windowMs - now) / 1000) };
	}

	record(id: string, now = Date.now()) {
		const recent = (this.hits.get(id) ?? []).filter((t) => now - t < this.windowMs);
		recent.push(now);
		this.hits.set(id, recent);
		if (this.hits.size > 10_000) this.prune(now);
	}

	private prune(now: number) {
		for (const [id, times] of this.hits) {
			if (!times.some((t) => now - t < this.windowMs)) this.hits.delete(id);
		}
	}
}

export const ipBurst = new RateLimiter(3, 10 * 60 * 1000);
export const ipDaily = new RateLimiter(10, 24 * 60 * 60 * 1000);
export const emailHourly = new RateLimiter(3, 60 * 60 * 1000);
export const challengeFetch = new RateLimiter(40, 10 * 60 * 1000);

/**
 * Checks every limiter before recording on any, so a rejected submission does not eat budget on
 * the limiters that would have allowed it.
 */
export function takeSubmission(ip: string, email: string, now = Date.now()): LimitResult {
	const checks: [RateLimiter, string][] = [
		[ipBurst, ip],
		[ipDaily, ip],
		[emailHourly, email]
	];
	let retryAfter = 0;
	for (const [limiter, id] of checks) {
		const result = limiter.peek(id, now);
		if (!result.ok) retryAfter = Math.max(retryAfter, result.retryAfter ?? 0);
	}
	if (retryAfter > 0) return { ok: false, retryAfter };
	for (const [limiter, id] of checks) limiter.record(id, now);
	return { ok: true };
}

/**
 * The client address as seen by the reverse proxy. nginx appends the real peer to any
 * client-supplied `X-Forwarded-For`, so the LAST entry is the only one that cannot be spoofed.
 */
export function clientIp(forwardedFor: string | null, fallback: string): string {
	const last = forwardedFor?.split(',').at(-1)?.trim();
	return last || fallback;
}
