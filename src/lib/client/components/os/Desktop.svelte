<script lang="ts">
	import os from '$lib/os.svelte';
	//import FileSystemObject from '$ui/os/FileSystemObject.svelte';
	import { showContextMenu } from '$lib/client/menu';
	import type { ContextMenuAction } from '$types/contextMenu';
	import { promptUploadFiles, uploadFiles } from '$lib/client/index.svelte';
	import Window from '$ui/os/Window.svelte';

	const desktopPath = '/home/desktop';

	function oncontextmenu(event: MouseEvent) {
		const { target } = event;
		if (!target) return;

		const contextMenu: ContextMenuAction[] = [
			{ title: 'View', action: [] },
			{ title: 'Sort by', action: [] },
			{ title: 'Upload', action: () => promptUploadFiles('/desktop') },
			{
				title: 'Paste', action: x => {
				}
			},
			{
				title: 'New', action: x => {
				}
			},
			{
				title: 'Properties', action: x => {
				}
			}
		];

		showContextMenu(event, contextMenu);
	}

	function dropHandler(event: DragEvent) {
		event.preventDefault();
		if (!event.dataTransfer) return;

		if (event.dataTransfer.files) {
			uploadFiles(event.dataTransfer.files, desktopPath);
			return;
		}

		const data = event.dataTransfer.getData('file');
		if (!data || data === '/' || data === desktopPath || desktopPath.startsWith(data + '/')) return;
		// move data to path
	}

	function pointerDown() {
		os.focusedProcessId = null;
		os.desktop.files.forEach((fso) => fso && (fso.isSelected = false));
	}
</script>

<div class="w-full flex-grow overflow-hidden">
	{#each os.processList as processData (processData)}
		<Window {processData} sendMessage={sendMessage}></Window>
	{/each}
	<div
		class="w-full h-full grid grid-cols-{os.desktop.cols} grid-rows-[{os.desktop.rows}] left-0 p-1.25"
		id="desktop"
		{oncontextmenu}
		ondragover={e => e.preventDefault()}
		ondrop={dropHandler}
		onpointerdown={pointerDown}
		role="grid"
		tabindex="0"
	>
		{#each os.desktop.files as fso (fso)}
			<div class="border border-transparent p-1.25 m-0.25 w-25 hover:bg-gray-800 hover:border-gray-600">
				{#if (fso === null)}
					<div></div>
				{:else}
					<!--<FileSystemObject fso={fso}></FileSystemObject>-->
				{/if}
			</div>
		{/each}
	</div>
</div>