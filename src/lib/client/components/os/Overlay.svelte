<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	let { onclose, children }: { onclose: () => void; children: Snippet } = $props();

	function onauxclick(event: MouseEvent) {
		// Rechtsklick (button 2) wird bereits über das contextmenu-Event
		// behandelt. Dessen auxclick beim Loslassen der rechten Maustaste
		// würde sonst genau das Menü wieder schließen, das dieser Rechtsklick
		// gerade geöffnet hat.
		if (event.button === 2) return;
		onclose();
	}

	onMount(() => {
		document.addEventListener('click', onclose, true);
		document.addEventListener('contextmenu', onclose, true);
		document.addEventListener('auxclick', onauxclick, true);

		return () => {
			document.removeEventListener('click', onclose, true);
			document.removeEventListener('contextmenu', onclose, true);
			document.removeEventListener('auxclick', onauxclick, true);
		};
	});
</script>

{@render children()}
