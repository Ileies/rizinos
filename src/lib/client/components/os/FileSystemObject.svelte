<script lang="ts">
	import { type FileSystemObject, FileType } from '$types/files';
	import { showContextMenu } from '$lib/client/menu';
	import { promptUploadFiles } from '$lib/client/index.svelte';
	import { uploadFiles } from '$lib/client/index.svelte.js';

	let { fso }: { fso: FileSystemObject } = $props();

	function getSymlinkTarget(fso: FileSystemObject): FileSystemObject {


	}

	function dropHandler(event: DragEvent) {
		if (fso.type === FileType.Directory || (fso.type === FileType.Symlink && getSymlinkTarget(fso).type === FileType.Directory)) {
			event.preventDefault();
			event.stopPropagation();
			if (!event.dataTransfer) return;

			if (event.dataTransfer.files.length) {
				uploadFiles(event.dataTransfer.files, fso.url);
			} else {
				// TODO: if (isExecutable) run app with param
				fetch('/api/os/move', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ from: event.dataTransfer?.getData('file'), to: fso.url })
				});
			}
		}

		const items = event.dataTransfer?.items;
		if (!items) return;

		let allFiles: FileEntry[] = [];
		for (const item of items) {
			const entry = item.webkitGetAsEntry();
			if (entry) {
				const entryFiles = await traverseDirectory(entry);
				allFiles = [...allFiles, ...entryFiles];
			}
		}
		await promptUploadFiles(allFiles);

	}
	}

</script>

<div
	class="border p-1.25 m-0.25 w-25 {fso.isSelected ? 'bg-gray-800 border-gray-600 hover:bg-gray-800' : 'border-transparent hover:bg-gray-600'}"
	draggable="true"
	oncontextmenu={e=> showContextMenu(e, ...)}
	ondblclick={() => {
			 run(`start "${fso.url}"`);
		 }}
	ondragstart={(e) => e.dataTransfer?.setData('file', fso.url)}
	ondrop={dropHandler}
	onkeydown={()=>{}}
	onpointerdown={(e) => {
			 e.stopPropagation();
			 fso.isSelected = true;
		 }}
	role="gridcell"
	tabindex="0"
>
	<div class="m-0 auto w-22.5">
		<img alt="Icon" class="h-22.5 w-22.5" draggable="false" src="/api/icon?icon={fso.icon}">
	</div>
	<div class="cursor-default text-white text-xs m-0 auto text-center break-words">{fso.url.split('/').at(-1)}</div>
</div>