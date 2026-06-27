<script lang="ts">
	import os from '$lib/os.svelte';
	import { Theme } from '$types';
	import { Moon, Sun } from '@lucide/svelte';

	$effect(() => {
		localStorage.setItem('theme', os.theme);
	});
</script>

<button
	class="flex items-center justify-center"
	onclick={() => (os.theme = os.theme === Theme.Dark ? Theme.Light : Theme.Dark)}
	aria-label="Toggle theme"
>
	{#if os.theme === Theme.Dark}
		<Sun size="18" />
	{:else}
		<Moon size="18" />
	{/if}
</button>
