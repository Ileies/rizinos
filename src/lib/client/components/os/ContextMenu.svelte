<script lang="ts">
	import Overlay from '$ui/os/Overlay.svelte';
	import os from '$lib/os.svelte';
	import type { ContextMenu, ContextMenuAction } from '$types/contextMenu';

	let subMenu: ContextMenu | null = $state(null);

	$effect(() => {
		os.contextMenu;
		subMenu = null;
	});

	function showSubMenu(
		event: PointerEvent | FocusEvent,
		actions: ContextMenuAction[] | ((target: EventTarget) => void)
	) {
		if (!os.contextMenu) return;
		if (typeof actions === 'function') {
			subMenu = null;
			return;
		}
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		subMenu = {
			x: rect.right,
			y: rect.top,
			target: os.contextMenu.target,
			actions
		};
	}
</script>

{#snippet menu(context: ContextMenu)}
	<div class="fixed flex flex-col" style={`top:${context.y}px;left:${context.x}px;`}>
		{#each context.actions as { action, title } (title)}
			<button
				class="hover:bg-gray-800"
				onclick={(event) => {
					if (typeof action === 'function') action(context.target);
					else event.stopPropagation();
				}}
				onpointerover={(event) => showSubMenu(event, action)}
				onfocus={(event) => showSubMenu(event, action)}>{title}</button
			>
		{/each}
	</div>
{/snippet}

{#if os.contextMenu}
	<Overlay onclose={() => (os.contextMenu = null)}>
		{@render menu(os.contextMenu)}
		{#if subMenu}
			<div>
				{@render menu(subMenu)}
			</div>
		{/if}
	</Overlay>
{/if}
