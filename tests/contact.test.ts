import { describe, expect, test } from 'bun:test';
import { checkAttachments, safeFilename, sniffImage } from '../src/lib/server/contact/attachments';
import {
	RateLimiter,
	clientIp,
	issueChallenge,
	takeSubmission,
	verifyChallenge
} from '../src/lib/server/contact/guard';
import { generateRef } from '../src/lib/server/contact/ref';
import { LIMITS } from '../src/lib/server/contact/topics';
import { clean, validateContact } from '../src/lib/server/contact/validate';

const valid = {
	topic: 'general',
	name: 'Ada Lovelace',
	email: 'Ada@Example.com',
	subject: 'Hello',
	message: 'This is a long enough message.',
	locale: 'de'
};

describe('validateContact', () => {
	test('accepts a valid message and normalises it', () => {
		const result = validateContact(valid);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.email).toBe('ada@example.com');
			expect(result.value.locale).toBe('de');
			expect(result.value.details).toEqual({});
		}
	});

	test('reports every missing required field with a code', () => {
		const result = validateContact({ topic: 'general' });
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.issues.map((i) => i.field).sort()).toEqual([
				'email',
				'message',
				'name',
				'subject'
			]);
			expect(result.issues.every((i) => i.code === 'required')).toBe(true);
		}
	});

	test('rejects unknown topics, bad emails and short or long messages', () => {
		expect(validateContact({ ...valid, topic: 'sales' }).ok).toBe(false);
		const bad = validateContact({ ...valid, email: 'not-an-email', message: 'short' });
		expect(bad.ok).toBe(false);
		if (!bad.ok) {
			expect(bad.issues).toContainEqual({ field: 'email', code: 'invalid_email' });
			expect(bad.issues).toContainEqual({ field: 'message', code: 'too_short' });
		}
		const long = validateContact({ ...valid, message: 'x'.repeat(LIMITS.message + 1) });
		expect(long.ok).toBe(false);
	});

	test('single-line fields cannot carry newlines (mail header injection)', () => {
		const result = validateContact({ ...valid, subject: 'Hi\r\nBcc: victim@example.com' });
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value.subject).not.toMatch(/[\r\n]/);
	});

	test('keeps only known detail fields for the topic and enforces options', () => {
		const ok = validateContact({
			...valid,
			topic: 'bug',
			details: { area: 'files', steps: 'Open files\nClick', evil: 'drop me' }
		});
		expect(ok.ok).toBe(true);
		if (ok.ok) expect(ok.value.details).toEqual({ area: 'files', steps: 'Open files\nClick' });

		const bad = validateContact({ ...valid, topic: 'bug', details: { area: 'nope' } });
		expect(bad.ok).toBe(false);
	});

	test('clean strips control and bidi override characters', () => {
		expect(clean('a\u0000b\u202Ec\r\nd')).toBe('abc\nd');
		expect(clean(42)).toBe('');
	});
});

describe('challenge', () => {
	test('is rejected when too fast, accepted after the minimum age, and single use', async () => {
		const t0 = 1_000_000;
		const token = await issueChallenge(t0);
		expect(await verifyChallenge(token, t0 + 500)).toBe('too_fast');
		expect(await verifyChallenge(token, t0 + 4_000)).toBe('ok');
		expect(await verifyChallenge(token, t0 + 5_000)).toBe('replayed');
	});

	test('expires and rejects tampering', async () => {
		const t0 = 2_000_000;
		const token = await issueChallenge(t0);
		expect(await verifyChallenge(token, t0 + 3 * 60 * 60 * 1000)).toBe('expired');

		const [issued, nonce, sig] = (await issueChallenge(t0)).split('.');
		expect(await verifyChallenge(`${Number(issued) - 10_000}.${nonce}.${sig}`, t0 + 4_000)).toBe(
			'invalid'
		);
		expect(await verifyChallenge('garbage', t0)).toBe('invalid');
		expect(await verifyChallenge(undefined, t0)).toBe('invalid');
	});
});

describe('rate limiting', () => {
	test('sliding window allows the limit, then reports retryAfter, then recovers', () => {
		const limiter = new RateLimiter(2, 10_000);
		limiter.record('a', 0);
		limiter.record('a', 1_000);
		const blocked = limiter.peek('a', 2_000);
		expect(blocked.ok).toBe(false);
		expect(blocked.retryAfter).toBe(8);
		expect(limiter.peek('b', 2_000).ok).toBe(true);
		expect(limiter.peek('a', 10_500).ok).toBe(true);
	});

	test('a rejected submission does not consume budget on the other limiters', () => {
		const ip = 'ip-test-1';
		const now = 10_000_000;
		for (let i = 0; i < 3; i++) expect(takeSubmission(ip, `u${i}@example.com`, now).ok).toBe(true);
		// IP burst limit (3) reached: a new email must be rejected without being recorded.
		expect(takeSubmission(ip, 'fresh@example.com', now + 1).ok).toBe(false);
		expect(takeSubmission('ip-test-2', 'fresh@example.com', now + 2).ok).toBe(true);
	});

	test('uses the last X-Forwarded-For entry, which the proxy appends', () => {
		expect(clientIp('6.6.6.6, 203.0.113.9', '::1')).toBe('203.0.113.9');
		expect(clientIp('203.0.113.9', '::1')).toBe('203.0.113.9');
		expect(clientIp(null, '::1')).toBe('::1');
		expect(clientIp('', '::1')).toBe('::1');
	});
});

describe('attachments', () => {
	const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
	const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
	const gif = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0]);
	const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50]);

	test('sniffs real image types and rejects everything else', () => {
		expect(sniffImage(png)).toBe('image/png');
		expect(sniffImage(jpg)).toBe('image/jpeg');
		expect(sniffImage(gif)).toBe('image/gif');
		expect(sniffImage(webp)).toBe('image/webp');
		expect(sniffImage(new TextEncoder().encode('<svg onload=alert(1)>'))).toBeNull();
		expect(sniffImage(new TextEncoder().encode('MZ executable'))).toBeNull();
	});

	test('ignores the claimed MIME type and extension', async () => {
		const file = new File([jpg], '../../etc/passwd.html', { type: 'text/html' });
		const result = await checkAttachments([file]);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.files[0].mimeType).toBe('image/jpeg');
			expect(result.files[0].filename).toBe('passwd.jpg');
		}
	});

	test('enforces count, size, emptiness and type', async () => {
		const mk = (bytes: Uint8Array, name = 'a.png') => new File([bytes], name);
		expect(await checkAttachments([mk(png), mk(png), mk(png), mk(png)])).toEqual({
			ok: false,
			issue: 'too_many'
		});
		expect(await checkAttachments([mk(new Uint8Array(0))])).toEqual({
			ok: false,
			issue: 'empty',
			index: 0
		});
		expect(await checkAttachments([mk(new TextEncoder().encode('hello world'), 'a.png')])).toEqual({
			ok: false,
			issue: 'unsupported_type',
			index: 0
		});
		const big = new Uint8Array(LIMITS.attachmentBytes + 1);
		big.set(png);
		expect(await checkAttachments([mk(png), mk(big)])).toEqual({
			ok: false,
			issue: 'too_large',
			index: 1
		});
	});

	test('safeFilename strips path parts and odd characters', () => {
		expect(safeFilename('C:\\Users\\x\\shot<1>.png', 'image/png')).toBe('shot_1_.png');
		expect(safeFilename('.hidden', 'image/gif')).toBe('hidden.gif');
		expect(safeFilename('', 'image/webp')).toBe('image.webp');
	});
});

test('generateRef yields unambiguous, well-formed, distinct references', () => {
	const refs = new Set(Array.from({ length: 200 }, generateRef));
	expect(refs.size).toBe(200);
	for (const ref of refs) expect(ref).toMatch(/^RZ-[A-HJKMNP-Z2-9]{6}$/);
});
