import { createHash, timingSafeEqual } from 'node:crypto';
import { createConnection } from 'node:net';

export const hashSecret = (secret: string) => createHash('sha256').update(secret).digest('hex');

export function matchesSecret(value: string | null, expected: string | undefined): boolean {
	return (
		!!value &&
		!!expected &&
		timingSafeEqual(Buffer.from(hashSecret(value)), Buffer.from(hashSecret(expected)))
	);
}

export function minecraftPacket(message: string): Buffer {
	const content = Buffer.from(message, 'utf8');
	const packet = Buffer.alloc(4 + content.length);
	packet.writeUInt32LE(content.length, 0);
	content.copy(packet, 4);
	return packet;
}

export function sendMinecraft(host: string, message: string, port = 7051): Promise<void> {
	return new Promise((resolve, reject) => {
		const socket = createConnection({ host, port });
		socket.setTimeout(5_000, () => socket.destroy(new Error('Minecraft connection timed out')));
		socket.once('error', reject);
		socket.once('connect', () => socket.end(minecraftPacket(message)));
		socket.once('finish', () => {
			socket.destroy();
			resolve();
		});
	});
}

export function cleanMinecraft(message: string): string {
	return message.replace(/[§&][0-9a-fk-orx]/gi, '').replace(/[\u0000-\u001f\u007f]/g, '');
}

export function minecraftMessage(prefix: string, name: string, message: string): string {
	// Only administrators may supply formatting codes in the prefix.
	return prefix.replaceAll('%1', name) + cleanMinecraft(message);
}
