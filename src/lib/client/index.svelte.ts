import os from '$lib/os.svelte';
import {
	type Action,
	type FileSystemObject,
	NotificationType,
	type Process,
	type VFSEntry
} from '$types';
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

async function readEntryFile(entry: FileSystemFileEntry): Promise<File> {
	return new Promise((resolve, reject) => entry.file(resolve, reject));
}

async function readAllDirEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
	// readEntries only returns a batch at a time, keep reading until it's exhausted
	const entries: FileSystemEntry[] = [];
	let batch: FileSystemEntry[];
	do {
		batch = await new Promise((resolve, reject) => reader.readEntries(resolve, reject));
		entries.push(...batch);
	} while (batch.length > 0);
	return entries;
}

async function traverseEntry(entry: FileSystemEntry, path = ''): Promise<File[]> {
	if (entry.isFile) {
		const file = await readEntryFile(entry as FileSystemFileEntry);
		return [new File([file], path + file.name, { type: file.type, lastModified: file.lastModified })];
	}
	if (entry.isDirectory) {
		const children = await readAllDirEntries((entry as FileSystemDirectoryEntry).createReader());
		const nested = await Promise.all(
			children.map((child) => traverseEntry(child, `${path}${entry.name}/`))
		);
		return nested.flat();
	}
	return [];
}

// Recursively resolves a drag-and-drop DataTransferItemList into a flat File list,
// baking each file's folder structure into its name (e.g. "sub/folder/file.txt").
export async function traverseDataTransferItems(items: DataTransferItemList): Promise<File[]> {
	const entries = Array.from(items)
		.map((item) => item.webkitGetAsEntry?.())
		.filter((entry): entry is FileSystemEntry => entry !== null && entry !== undefined);
	return (await Promise.all(entries.map((entry) => traverseEntry(entry)))).flat();
}

// Uploads files into a VFS directory. Returns created VFSEntry objects.
// Blobs that already exist on the server are not re-transferred.
// Sub-folders (via `webkitRelativePath` or a `/`-containing name from traverseDataTransferItems)
// are recreated on the server as needed.
export async function uploadFiles(
	fileList: FileList | File[],
	dirId: string | null = null
): Promise<VFSEntry[]> {
	const fileArray = Array.from(fileList);

	// Hash all files client-side
	const hashes = await Promise.all(fileArray.map(hashFile));

	// Check which blobs already exist (dedup fast-path)
	const { existing } = (await fetch('/api/os/fso/check', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ hashes })
	}).then((r) => r.json())) as { existing: string[] };
	const existingSet = new Set(existing);

	const dirIdCache = new Map<string, string | null>([['', dirId]]);
	async function resolveDir(relDirPath: string): Promise<string | null> {
		if (dirIdCache.has(relDirPath)) return dirIdCache.get(relDirPath)!;
		const segments = relDirPath.split('/');
		const name = segments.pop()!;
		const parentId = await resolveDir(segments.join('/'));
		const res = await fetch('/api/os/fso/mkdir', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name, dirId: parentId })
		});
		if (!res.ok) throw new Error(`Ordner konnte nicht erstellt werden: ${relDirPath}`);
		const entry = (await res.json()) as VFSEntry;
		dirIdCache.set(relDirPath, entry.id);
		return entry.id;
	}

	const results: VFSEntry[] = [];
	for (let i = 0; i < fileArray.length; i++) {
		const file = fileArray[i];
		const hash = hashes[i];
		const relPath = file.webkitRelativePath || file.name;
		const segments = relPath.split('/');
		const name = segments.pop()!;
		const targetDirId = await resolveDir(segments.join('/'));

		const fd = new FormData();
		fd.append('hash', hash);
		fd.append('name', name);
		if (targetDirId) fd.append('dirId', targetDirId);
		if (!existingSet.has(hash)) fd.append('file', file);

		const res = await fetch('/api/os/fso/upload', { method: 'POST', body: fd });
		if (!res.ok) throw new Error(`Upload fehlgeschlagen: ${name}`);
		results.push(await res.json());
	}
	return results;
}

export async function loadDesktop(): Promise<void> {
	const res = await fetch('/api/os/fso/list');
	if (!res.ok) throw new Error('Desktop konnte nicht geladen werden.');
	const entries = (await res.json()) as VFSEntry[];
	os.desktop.files = entries.map((entry) => ({ entry, isSelected: false }));
}

export async function renameFso(fso: FileSystemObject, newName: string): Promise<void> {
	const res = await fetch('/api/os/fso/move', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ id: fso.entry.id, newName })
	});
	if (!res.ok) throw new Error('Umbenennen fehlgeschlagen.');
	fso.entry.name = newName;
}

export async function deleteFso(fso: FileSystemObject): Promise<void> {
	const res = await fetch('/api/os/fso/delete', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ id: fso.entry.id })
	});
	if (!res.ok) throw new Error('Löschen fehlgeschlagen.');
	os.desktop.files = os.desktop.files.filter((f) => f !== fso);
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

export async function promptUploadFolder(dirId: string | null = null): Promise<VFSEntry[]> {
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
