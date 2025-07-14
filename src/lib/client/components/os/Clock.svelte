<script lang="ts">
	import { format } from 'date-fns';

	let time: string = $state('12:00 AM');
	let date: string = $state('1/1/2001');

	// Update time every second
	$effect(() => {
		let timer = setInterval(() => {
			time = format(new Date(), 'h:mm a');
			date = format(new Date(), 'M/d/y');
		}, 1000);

		// Cleanup on destroy
		return () => {
			clearInterval(timer);
		};
	});
</script>

<div class="flex flex-col items-end text-xs">
	<div>{time}</div>
	<div>{date}</div>
</div>
