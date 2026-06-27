<script lang="ts">
	import { X } from '@lucide/svelte';

	let {
		open = $bindable(false),
		title = '',
		wide = false,
		children
	}: {
		open: boolean;
		title?: string;
		wide?: boolean;
		children?: any;
	} = $props();

	let dialog: HTMLDialogElement;

	$effect(() => {
		if (!dialog) return;
		if (open) dialog.showModal();
		else if (dialog.open) dialog.close();
	});
</script>

<dialog
	bind:this={dialog}
	onclose={() => (open = false)}
	class="bg-background text-foreground border border-border rounded-lg shadow-2xl p-0 m-auto backdrop:bg-black/60 max-h-[90vh] overflow-y-auto {wide
		? 'w-full max-w-2xl'
		: 'w-full max-w-md'}"
>
	<div class="sticky top-0 z-10 flex items-center justify-between bg-background border-b px-5 py-3">
		<h2 class="font-semibold text-sm">{title}</h2>
		<button
			onclick={() => (open = false)}
			class="rounded p-1 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
		>
			<X size={14} />
		</button>
	</div>
	<div class="px-5 py-4">
		{@render children?.()}
	</div>
</dialog>
