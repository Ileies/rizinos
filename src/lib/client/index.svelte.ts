import os from '$lib/os.svelte';
import { type Action, NotificationType, type Process } from '$types';

export function getSelectionText(): string {
	const activeEl = document.activeElement as HTMLInputElement | HTMLTextAreaElement | null;
	const activeElTagName = activeEl?.tagName.toLowerCase();
	if (activeEl && (activeElTagName === 'textarea' || (activeElTagName === 'input' && /^(?:text|search|password|tel|url)$/i.test(activeEl.type))) && typeof activeEl.selectionStart === 'number') {
		return activeEl.value.slice(activeEl.selectionStart, activeEl.selectionEnd ?? undefined);
	}
	return window.getSelection()?.toString() ?? '';
}

export function downloadFile(filePath: string): void {
	const link = document.createElement('a');
	const basename = filePath.split(/\//).pop();
	if (!basename) return;
	link.download = basename;
	link.href = `/storage/${encodeURIComponent(filePath)}`;
	link.click();
}

export async function uploadFiles(files: FileList, path: string, onprogress: (progress: number) => void = () => {
}): Promise<string> {
	// TODO: Specify default path
	return new Promise<string>((resolve, reject) => {
		const formData = new FormData();
		formData.append('path', path);
		Array.from(files).forEach((file) => formData.append('files', file));
		const xhr = new XMLHttpRequest();
		xhr.upload.onprogress = (event) => {
			if (event.lengthComputable) {
				onprogress(Math.round((event.loaded / event.total) * 100));
			}
		};
		xhr.onload = () => {
			onprogress(0);
			resolve((xhr.status === 200) ? 'Files uploaded successfully!' : `Upload failed: ${xhr.statusText}`);
		};
		xhr.onerror = () => {
			onprogress(0);
			reject('An error occurred during the upload.');
		};
		xhr.open('POST', '/api/os/upload', true);
		xhr.send(formData);
		// TODO: Remove all api calls, everywhere, and handle everything in the websocket
		// TODO: show that upload was started
	});
}

export async function promptUploadFiles(path: string, onprogress: (progress: number) => void = () => {
}): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		const input = document.createElement('input');
		input.type = 'file';
		input.multiple = true;
		input.onchange = () => {
			if (!input.files) {
				return reject('No files selected');
			}
			uploadFiles(input.files, path, onprogress).then(resolve).catch(reject);
		};
		input.click();
	});
}

export async function promptUploadFolder(path: string, onprogress: (progress: number) => void = () => {
}): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		const input = document.createElement('input');
		input.type = 'file';
		input.multiple = true;
		input.webkitdirectory = true;
		input.onchange = () => {
			if (!input.files) {
				return reject('No files selected');
			}
			uploadFiles(input.files, path, onprogress).then(resolve).catch(reject);
		};
		input.click();
	});
}

export function launchApp(appId: string, data = '', position: {
	top: number,
	left: number,
	height: number,
	width: number
} | null = null, admin = false) {
	if (data) data = '&' + data;
	let id = 1;
	while (os.processList.find(p => p.id == id)) id++;

	os.processList = [...os.processList, {
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
	}];

	os.focusedProcessId = id;
}

export function focusProcess(process: Process) {
	process.isMinimized = false;
	os.focusedProcessId = process.id;
	os.processList.forEach(p => p.zIndex > process.zIndex && p.zIndex--);
	process.zIndex = os.processList.length;
}

export function closeProcess(process: Process) {
	// TODO: Tell the app to close
	if (os.focusedProcessId === process.id) os.focusedProcessId = null;
	os.processList.forEach(p => p.zIndex > process.zIndex && p.zIndex--);
	os.processList = os.processList.filter(p => p.id !== process.id);
}

export function addNotification(title: string, body = '', type: NotificationType = NotificationType.INFO, actions: Action[] = [], appId = 'system', closable = false) {
	os.notifications = [...os.notifications, {
		title, body, appId, actions, type, closable,
		createdAt: new Date()
	}];
}
