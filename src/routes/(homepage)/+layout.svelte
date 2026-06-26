<script lang="ts">
	import Header from '$ui/homepage/Header.svelte';
	import Footer from '$ui/homepage/Footer.svelte';

	let { children } = $props();
</script>

<div class="flex min-h-screen flex-col">
	<Header />
	<main class="flex flex-grow">
		{@render children()}
	</main>
</div>
<Footer />
