<script lang="ts">
	import os from '$lib/os.svelte';
	import { Theme } from '$types';
	import { Moon, Sun } from 'lucide-svelte';
	import { browser } from '$app/environment';

	$effect(() => {
		localStorage.setItem('theme', os.theme);
	});

	const value = browser && window.matchMedia('(prefers-color-scheme: dark)').matches;
</script>

<label class="swap swap-rotate">
	<input checked={os.theme === Theme.Dark} class="theme-controller"
				 onchange={() => os.theme = os.theme === Theme.Dark ? Theme.Light : Theme.Dark} type="checkbox"
				 value={value ? Theme.Light : Theme.Dark} />
	<Sun class={value ? 'swap-on' : 'swap-off'} size="18" />
	<Moon class={value ? 'swap-off' : 'swap-on'} size="18" />
</label>
