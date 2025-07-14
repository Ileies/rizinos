<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	let { onclose, children }: { onclose: () => void, children: Snippet } = $props();

	onMount(() => {
		document.addEventListener('click', onclose, true);
		document.addEventListener('contextmenu', onclose, true);
		document.addEventListener('auxclick', onclose, true);

		return () => {
			document.removeEventListener('click', onclose, true);
			document.removeEventListener('contextmenu', onclose, true);
			document.removeEventListener('auxclick', onclose, true);
		};
	});
</script>

{@render children()}
