<script lang="ts">
	import type { Snippet } from 'svelte';

	const { children, title, innerClasses, ...restProps }: {
		children: Snippet,
		title?: string,
		innerClasses?: string,
	} & Record<string, unknown> = $props();
</script>

<div {...restProps} class="group p-0.5"
		 role="button" tabindex="0" title={title}>
	<div
		class="flex flex-col justify-center h-full rounded-sm overflow-hidden px-1 {innerClasses}">
		{@render children()}
	</div>
</div>