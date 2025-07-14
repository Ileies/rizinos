<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();

	const error = [
		'',
		'Please verify your E-Mail by visiting the link sent to your inbox',
		'Token invalid or expired',
		'A user with the same username or email already exists'
	][data.status];
</script>

<div class="max-w-7xl w-full">
	<div class="mb-6">
		<h1 class="text-2xl font-bold mb-4">Confirm your email</h1>
		{#if error}
			<p class="text-red-500">{error}</p>
		{:else}
			<p class="text-gray-500">Your email was successfully verified!</p>
		{/if}
		<div>
			<button class="btn btn-primary" onclick={() => goto('/')}>
				Return to Homepage
			</button>
		</div>
	</div>
</div>