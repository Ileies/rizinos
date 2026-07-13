<script lang="ts">
	import os from '$lib/os.svelte';
	import FileSystemObject from '$ui/os/FileSystemObject.svelte';
	import { showContextMenu } from '$lib/client/menu';
	import type { ContextMenuAction } from '$types/contextMenu';
	import {
		loadDesktop,
		promptUploadFiles,
		traverseDataTransferItems,
		uploadFiles
	} from '$lib/client/index.svelte';
	import Window from '$ui/os/Window.svelte';
	import { promptDialog } from '$lib/dialog.svelte';

	const ICON_WIDTH = 104; // w-25 (100px) + horizontal margin
	const ICON_HEIGHT = 132; // icon + label + vertical margin

	$effect(() => {
		os.desktop.cols = Math.max(1, Math.floor(os.screenSize.width / ICON_WIDTH));
		os.desktop.rows = Math.max(1, Math.floor((os.screenSize.height - 40) / ICON_HEIGHT));
	});

	$effect(() => {
		loadDesktop();
	});

	async function newFolder() {
		const name = await promptDialog('Name of the new folder:', 'New Folder');
		if (!name?.trim()) return;
		const res = await fetch('/api/os/fso/mkdir', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: name.trim() })
		});
		if (!res.ok) return;
		const entry = await res.json();
		os.desktop.files = [...os.desktop.files, { entry, isSelected: false }];
	}

	function sortBy(key: 'name' | 'type' | 'updatedAt') {
		os.desktop.files = [...os.desktop.files].sort((a, b) => {
			if (!a || !b) return 0;
			if (key === 'type') return a.entry.type.localeCompare(b.entry.type);
			if (key === 'updatedAt') return b.entry.updatedAt.localeCompare(a.entry.updatedAt);
			return a.entry.name.localeCompare(b.entry.name);
		});
	}

	function oncontextmenu(event: MouseEvent) {
		const { target } = event;
		if (!target) return;

		const contextMenu: ContextMenuAction[] = [
			{
				title: 'Sort by',
				action: [
					{ title: 'Name', action: () => sortBy('name') },
					{ title: 'Type', action: () => sortBy('type') },
					{ title: 'Date modified', action: () => sortBy('updatedAt') }
				]
			},
			{ title: 'Upload', action: () => promptUploadFiles(null) },
			{ title: 'New Folder', action: newFolder },
			{ title: 'Refresh', action: () => loadDesktop() }
		];

		showContextMenu(event, contextMenu);
	}

	async function dropHandler(event: DragEvent) {
		event.preventDefault();
		if (!event.dataTransfer) return;

		const files = event.dataTransfer.items?.length
			? await traverseDataTransferItems(event.dataTransfer.items)
			: Array.from(event.dataTransfer.files);

		if (files.length) {
			await uploadFiles(files, null);
			await loadDesktop();
			return;
		}

		const sourceId = event.dataTransfer.getData('vfs-id');
		if (!sourceId) return;
		fetch('/api/os/fso/move', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: sourceId, targetDirId: null })
		}).then(() => loadDesktop());
	}

	function pointerDown() {
		os.focusedProcessId = null;
		os.desktop.files.forEach((fso) => fso && (fso.isSelected = false));
	}
</script>

<div class="w-full flex-grow overflow-hidden">
	{#each os.processList as processData (processData)}
		<Window {processData}></Window>
	{/each}
	<div
		class="grid h-full w-full left-0 p-1.25"
		style="grid-template-columns: repeat({os.desktop
			.cols}, minmax(0, 1fr)); grid-template-rows: repeat({os.desktop.rows}, minmax(0, 1fr));"
		id="desktop"
		{oncontextmenu}
		ondragover={(e) => e.preventDefault()}
		ondrop={dropHandler}
		onpointerdown={pointerDown}
		role="grid"
		tabindex="0"
	>
		{#each os.desktop.files as fso (fso)}
			{#if fso === null}
				<div class="m-0.25 w-25 border border-transparent p-1.25"></div>
			{:else}
				<FileSystemObject {fso}></FileSystemObject>
			{/if}
		{/each}
	</div>
</div>
