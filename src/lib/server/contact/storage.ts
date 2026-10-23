import { join } from 'path';
import { mkdir, unlink } from 'fs/promises';
import { dev } from '$app/env';
import { STORAGE_DIRECTORY } from '$app/env/private';

const dir = () => join(dev ? './uploads' : STORAGE_DIRECTORY, 'contact');

function pathFor(storageKey: string): string {
	// storageKey is generated server-side, but never let a bad row escape the directory.
	if (!/^[A-Za-z0-9_-]+\.[a-z0-9]{2,4}$/.test(storageKey)) throw new Error('Invalid storage key');
	return join(dir(), storageKey);
}

export async function writeAttachment(storageKey: string, bytes: Uint8Array): Promise<void> {
	await mkdir(dir(), { recursive: true });
	await Bun.write(pathFor(storageKey), bytes);
}

export function readAttachment(storageKey: string) {
	return Bun.file(pathFor(storageKey));
}

export async function deleteAttachment(storageKey: string): Promise<void> {
	await unlink(pathFor(storageKey)).catch(() => {});
}
