// 32 symbols (no 0/O/1/I/L) so 256 % 32 === 0 and random bytes map without modulo bias.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Short reference shown to the sender and staff, e.g. `RZ-7K3M9Q`. */
export function generateRef(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(6));
	return 'RZ-' + Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}
