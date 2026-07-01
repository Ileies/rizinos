import os from '$lib/os.svelte';
import { type Action, NotificationType, type Process, type VFSEntry } from '$types';
import { blake3 } from '@noble/hashes/blake3.js';
import { bytesToHex } from '@noble/hashes/utils.js';

export function getSelectionText(): string {
	const activeEl = document.activeElement as HTMLInputElement | HTMLTextAreaElement | null;
	const activeElTagName = activeEl?.tagName.toLowerCase();
	if (
		activeEl &&
		(activeElTagName === 'textarea' ||
			(activeElTagName === 'input' && /^(?:text|search|password|tel|url)$/i.test(activeEl.type))) &&
		typeof activeEl.selectionStart === 'number'
	) {
		return activeEl.value.slice(activeEl.selectionStart, activeEl.selectionEnd ?? undefined);
	}
	return window.getSelection()?.toString() ?? '';
}

export function downloadFile(fileId: string, name?: string): void {
	const link = document.createElement('a');
	if (name) link.download = name;
	link.href = `/storage/${fileId}?download`;
	link.click();
}

async function hashFile(file: File): Promise<string> {
	return bytesToHex(blake3(new Uint8Array(await file.arrayBuffer())));
}

// Uploads files into a VFS directory. Returns created VFSEntry objects.
// Blobs that already exist on the server are not re-transferred.
export async function uploadFiles(fileList: FileList, dirId: string | null = null): Promise<VFSEntry[]> {
	const fileArray = Array.from(fileList);

	// Hash all files client-side
	const hashes = await Promise.all(fileArray.map(hashFile));

	// Check which blobs already exist (dedup fast-path)
	const { existing } = await fetch('/api/os/fso/check', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ hashes })
	}).then((r) => r.json()) as { existing: string[] };
	const existingSet = new Set(existing);

	const results: VFSEntry[] = [];
	for (let i = 0; i < fileArray.length; i++) {
		const file = fileArray[i];
		const hash = hashes[i];
		const fd = new FormData();
		fd.append('hash', hash);
		fd.append('name', file.name);
		if (dirId) fd.append('dirId', dirId);
		if (!existingSet.has(hash)) fd.append('file', file);

		const res = await fetch('/api/os/fso/upload', { method: 'POST', body: fd });
		if (!res.ok) throw new Error(`Upload fehlgeschlagen: ${file.name}`);
		results.push(await res.json());
	}
	return results;
}

export async function promptUploadFiles(dirId: string | null = null): Promise<VFSEntry[]> {
	return new Promise((resolve, reject) => {
		const input = document.createElement('input');
		input.type = 'file';
		input.multiple = true;
		input.onchange = () => {
			if (!input.files) return reject('Keine Dateien ausgewählt.');
			uploadFiles(input.files, dirId).then(resolve).catch(reject);
		};
		input.click();
	});
}

export async function promptUploadFolder(
	dirId: string | null = null
): Promise<VFSEntry[]> {
	return new Promise((resolve, reject) => {
		const input = document.createElement('input');
		input.type = 'file';
		input.multiple = true;
		input.webkitdirectory = true;
		input.onchange = () => {
			if (!input.files) return reject('Keine Dateien ausgewählt.');
			uploadFiles(input.files, dirId).then(resolve).catch(reject);
		};
		input.click();
	});
}

export function launchApp(
	appId: string,
	data = '',
	position: {
		top: number;
		left: number;
		height: number;
		width: number;
	} | null = null,
	admin = false
) {
	if (data) data = '&' + data;
	let id = 1;
	while (os.processList.find((p) => p.id == id)) id++;

	os.processList = [
		...os.processList,
		{
			id,
			appId,
			isHidden: false,
			isMinimized: false,
			isMaximized: false,
			isAdmin: admin,
			zIndex: os.processList.length + 1,
			position: position ?? {
				top: 0.25, // TODO: Instead of 0.25, get stored number from localStorage
				left: 0.25,
				height: 0.5,
				width: 0.5
			}
		}
	];

	os.focusedProcessId = id;
}

export function focusProcess(process: Process) {
	process.isMinimized = false;
	os.focusedProcessId = process.id;
	os.processList.forEach((p) => p.zIndex > process.zIndex && p.zIndex--);
	process.zIndex = os.processList.length;
}

export function closeProcess(process: Process) {
	// TODO: Tell the app to close
	if (os.focusedProcessId === process.id) os.focusedProcessId = null;
	os.processList.forEach((p) => p.zIndex > process.zIndex && p.zIndex--);
	os.processList = os.processList.filter((p) => p.id !== process.id);
}

export function addNotification(
	title: string,
	body = '',
	type: NotificationType = NotificationType.INFO,
	actions: Action[] = [],
	appId = 'system',
	closable = false
) {
	os.notifications = [
		...os.notifications,
		{
			title,
			body,
			appId,
			actions,
			type,
			closable,
			createdAt: new Date()
		}
	];
}
