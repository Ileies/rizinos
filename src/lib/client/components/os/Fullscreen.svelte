<script lang="ts">
	import { onMount } from 'svelte';
	import { Maximize, Minimize } from 'lucide-svelte';

	let fullscreenEnabled = $state(false);

	function toggleFullscreen() {
		if (document.fullscreenElement) { // Or: window.fullScreen
			document.exitFullscreen();
		} else {
			document.documentElement.requestFullscreen();
		}
	}

	onMount(() => {
		const eventListener = () => {
			fullscreenEnabled = document.fullscreenEnabled;
		};
		document.addEventListener('fullscreenchange', eventListener);
		eventListener();
		return () => document.removeEventListener('fullscreenchange', eventListener);
	});
</script>

<button onclick={toggleFullscreen}>
	{#if (fullscreenEnabled)}
		<Minimize />
	{:else}
		<Maximize />
	{/if}
</button>
