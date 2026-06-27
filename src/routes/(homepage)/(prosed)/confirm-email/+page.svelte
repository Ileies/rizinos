<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Button from '$shadcn/button';

	let { data } = $props();

	const error = [
		'',
		'Please verify your E-Mail by visiting the link sent to your inbox',
		'Token invalid or expired',
		'A user with the same username or email already exists'
	][data.status];
</script>

<div class="w-full max-w-7xl">
	<div class="mb-6">
		<h1 class="mb-4 text-2xl font-bold">Confirm your email</h1>
		{#if error}
			<p class="text-red-500">{error}</p>
		{:else}
			<p class="text-gray-500">Your email was successfully verified!</p>
		{/if}
		<div>
			<Button.Root class="mt-4" onclick={() => goto('/')}>Return to Homepage</Button.Root>
		</div>
	</div>
</div>
