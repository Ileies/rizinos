<script lang="ts">
	let { children } = $props();
</script>
<div class="flex justify-around m-8">
	<div class="prose">
		{@render children()}
	</div>
</div>