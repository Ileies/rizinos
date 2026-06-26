<script lang="ts">
	import type { Snippet } from 'svelte';

	const {
		children,
		title,
		innerClasses,
		...restProps
	}: {
		children: Snippet;
		title?: string;
		innerClasses?: string;
	} & Record<string, unknown> = $props();
</script>

<div {...restProps} class="group p-0.5" role="button" tabindex="0" {title}>
	<div class="flex h-full flex-col justify-center overflow-hidden rounded-sm px-1 {innerClasses}">
		{@render children()}
	</div>
</div>
