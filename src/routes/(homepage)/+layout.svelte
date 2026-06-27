<script lang="ts">
	import Header from '$ui/homepage/Header.svelte';
	import Footer from '$ui/homepage/Footer.svelte';

	let { children, data } = $props();
</script>

<div class="flex min-h-screen flex-col">
	<Header loggedIn={data.loggedIn} />
	<main class="flex flex-grow">
		{@render children()}
	</main>
</div>
<Footer />
