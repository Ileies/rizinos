<script lang="ts">
	import AdminNav from '$lib/components/AdminNav.svelte';
	let { children } = $props();
</script>

<div class="min-h-screen bg-background">
	<AdminNav />
	{@render children()}
</div>
