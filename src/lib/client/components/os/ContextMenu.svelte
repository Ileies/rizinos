<script lang="ts">
	import Overlay from '$ui/os/Overlay.svelte';
	import os from '$lib/os.svelte';
	import type { ContextMenu, ContextMenuAction } from '$types/contextMenu';

	let subMenu: ContextMenu | null = $state(null);

	//defaultMenus[target?.dataset.context || '']

	function showSubMenu(actions: ContextMenuAction[] | ((target: EventTarget) => void)) {
		if (!os.contextMenu) return;
		if (typeof actions !== 'function') subMenu = {
			// TODO: Calculate the position of the sub-menu
			x: 1,
			y: 1,
			target: os.contextMenu.target,
			actions
		};
	}
</script>

{#snippet menu(context: ContextMenu)}
	<div class="fixed flex flex-col" style={`top:${context.y}px;left:${context.x}px;`}>
		{#each context.actions as { action, title } (title)}
			{#if (typeof action == 'function') }
				<button class="hover:bg-gray-800"
								onclick={(event) => {
									if (typeof action === 'function') action(context.target);
									else event.stopPropagation();
								}}
								onpointerover={() => showSubMenu(action)}
								onfocus={() => showSubMenu(action)}
				>{title}</button>
			{/if}
		{/each}
	</div>
{/snippet}

{#if (os.contextMenu)}
	<Overlay onclose={() => os.contextMenu = null}>
		{@render menu(os.contextMenu)}
		{#if (subMenu)}
			<div>
				{@render menu(subMenu)}
			</div>
		{/if}
	</Overlay>
{/if}