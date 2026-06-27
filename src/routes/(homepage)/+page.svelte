<script lang="ts">
	import Hero from '$ui/homepage/Hero.svelte';

	let { data } = $props();
</script>

<Hero loggedIn={data.loggedIn} />
