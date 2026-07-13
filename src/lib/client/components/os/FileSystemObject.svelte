<script lang="ts">
	import { type FileSystemObject, FileType } from '$types/files';
	import { showContextMenu } from '$lib/client/menu';
	import {
		deleteFso,
		downloadFile,
		renameFso,
		traverseDataTransferItems,
		uploadFiles
	} from '$lib/client/index.svelte.js';
	import { confirmDialog } from '$lib/dialog.svelte';

	let { fso }: { fso: FileSystemObject } = $props();

	let isRenaming = $state(false);
	let renameValue = $state('');

	function resolvedType(): FileType {
		if (fso.entry.type === FileType.Symlink) {
			return fso.entry.resolved?.type ?? FileType.File;
		}
		return fso.entry.type;
	}

	function resolvedMimeType(): string | null {
		if (fso.entry.type === FileType.Symlink) {
			return fso.entry.resolved?.mimeType ?? null;
		}
		return fso.entry.mimeType;
	}

	const iconSrc = $derived(
		`/api/os/icon?type=${resolvedType()}${resolvedMimeType() ? `&mime=${encodeURIComponent(resolvedMimeType()!)}` : ''}`
	);

	function focusOnMount(el: HTMLInputElement) {
		el.focus();
		el.select();
	}

	function startRename() {
		renameValue = fso.entry.name;
		isRenaming = true;
	}

	async function commitRename() {
		isRenaming = false;
		const newName = renameValue.trim();
		if (!newName || newName === fso.entry.name) return;
		await renameFso(fso, newName);
	}

	async function remove() {
		if (!(await confirmDialog(`Delete "${fso.entry.name}"?`))) return;
		await deleteFso(fso);
	}

	function open() {
		if (resolvedType() === FileType.Directory) return; // TODO: Folder navigation arrives with the app platform (Explorer app)
		downloadFile(fso.entry.id, fso.entry.name);
	}

	function contextMenu(event: MouseEvent) {
		showContextMenu(event, [
			...(resolvedType() !== FileType.Directory ? [{ title: 'Download', action: open }] : []),
			{ title: 'Rename', action: startRename },
			{ title: 'Delete', action: remove }
		]);
	}

	async function dropHandler(event: DragEvent) {
		if (resolvedType() !== FileType.Directory) return;
		event.preventDefault();
		event.stopPropagation();
		if (!event.dataTransfer) return;

		const files = event.dataTransfer.items?.length
			? await traverseDataTransferItems(event.dataTransfer.items)
			: Array.from(event.dataTransfer.files);

		if (files.length) {
			// External file/folder drop: upload into this directory
			await uploadFiles(files, fso.entry.id);
		} else {
			// Internal drag: move VFS entry into this directory
			const sourceId = event.dataTransfer.getData('vfs-id');
			if (sourceId) {
				fetch('/api/os/fso/move', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ id: sourceId, targetDirId: fso.entry.id })
				});
			}
		}
	}
</script>

<div
	class="m-0.25 w-25 border p-1.25 {fso.isSelected
		? 'border-gray-600 bg-gray-800 hover:bg-gray-800'
		: 'border-transparent hover:bg-gray-600'}"
	draggable="true"
	oncontextmenu={contextMenu}
	ondblclick={open}
	ondragstart={(e) => e.dataTransfer?.setData('vfs-id', fso.entry.id)}
	ondrop={dropHandler}
	onkeydown={(e) => {
		if (e.key === 'Enter') open();
		else if (e.key === 'F2') startRename();
		else if (e.key === 'Delete') remove();
	}}
	onpointerdown={(e) => {
		e.stopPropagation();
		fso.isSelected = true;
	}}
	role="gridcell"
	tabindex="0"
>
	<div class="auto m-0 w-22.5">
		<img alt="Icon" class="h-22.5 w-22.5" draggable="false" src={iconSrc} />
		{#if fso.entry.type === FileType.Symlink}
			<div class="absolute bottom-0 left-0 text-xs">↗</div>
		{/if}
	</div>
	{#if isRenaming}
		<input
			bind:value={renameValue}
			class="auto m-0 w-full bg-gray-900 text-center text-xs text-white"
			onblur={commitRename}
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => {
				e.stopPropagation();
				if (e.key === 'Enter') commitRename();
				else if (e.key === 'Escape') isRenaming = false;
			}}
			use:focusOnMount
		/>
	{:else}
		<div class="auto m-0 cursor-default text-center text-xs break-words text-white">
			{fso.entry.name}
		</div>
	{/if}
</div>
