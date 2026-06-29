<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
	<main class="grid min-h-full place-items-center px-6 py-24 sm:py-32">
		<h1 class="text-center text-4xl font-bold text-red-600">
			{page.status}
		</h1>
		<div>
			<p class="mt-4 text-center text-lg text-gray-500">
				{#if page.status === 404}
					Page not found.
				{:else}
					An error occurred.<br />
					<span class="mt-4 text-sm text-gray-600">
						{page.error?.message}
					</span>
				{/if}
			</p>
			<p class="mt-10 text-center">
				<a
					class="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
					href="/">Go back home</a
				>
			</p>
		</div>
	</main>
</div>
