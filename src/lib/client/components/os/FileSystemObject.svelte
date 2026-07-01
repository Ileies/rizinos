<script lang="ts">
	import { type FileSystemObject, FileType } from '$types/files';
	import { showContextMenu } from '$lib/client/menu';
	import { uploadFiles } from '$lib/client/index.svelte.js';

	let { fso }: { fso: FileSystemObject } = $props();

	function resolvedType(): FileType {
		if (fso.entry.type === FileType.Symlink) {
			return fso.entry.resolved?.type ?? FileType.File;
		}
		return fso.entry.type;
	}

	async function dropHandler(event: DragEvent) {
		if (resolvedType() !== FileType.Directory) return;
		event.preventDefault();
		event.stopPropagation();
		if (!event.dataTransfer) return;

		if (event.dataTransfer.files.length) {
			// External file drop: upload into this directory
			await uploadFiles(event.dataTransfer.files, fso.entry.id);
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
	oncontextmenu={(e) => showContextMenu(e, [] /* TODO: Kontext-Menü für Dateien */)}
	ondblclick={() => {
		// TODO: launchApp with file entry
	}}
	ondragstart={(e) => e.dataTransfer?.setData('vfs-id', fso.entry.id)}
	ondrop={dropHandler}
	onkeydown={() => {}}
	onpointerdown={(e) => {
		e.stopPropagation();
		fso.isSelected = true;
	}}
	role="gridcell"
	tabindex="0"
>
	<div class="auto m-0 w-22.5">
		<img alt="Icon" class="h-22.5 w-22.5" draggable="false" src="/api/icon?icon={fso.icon}" />
		{#if fso.entry.type === FileType.Symlink}
			<div class="absolute bottom-0 left-0 text-xs">↗</div>
		{/if}
	</div>
	<div class="auto m-0 cursor-default text-center text-xs break-words text-white">
		{fso.entry.name}
	</div>
</div>
