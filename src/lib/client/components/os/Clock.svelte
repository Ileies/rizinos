<script lang="ts">
	import { format } from 'date-fns';
	import { SvelteDate } from 'svelte/reactivity';

	const now = new SvelteDate();

	$effect(() => {
		const timer = setInterval(() => now.setTime(Date.now()), 1000);
		return () => clearInterval(timer);
	});
</script>

<div class="flex flex-col items-end text-xs">
	<div>{format(now, 'h:mm a')}</div>
	<div>{format(now, 'M/d/y')}</div>
</div>
