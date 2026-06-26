<script lang="ts">
	let { children } = $props();
</script>

<div class="m-8 flex justify-around">
	<div class="prose">
		{@render children()}
	</div>
</div>
