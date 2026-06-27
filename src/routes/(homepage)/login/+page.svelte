<script lang="ts">
	import type { ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import { ArrowRight } from '@lucide/svelte';
	import * as m from '$lib/messages';

	let { form }: { form: ActionData } = $props();

	let emailElement: HTMLInputElement;

	onMount(() => {
		emailElement.focus();
	});
</script>

<div
	class="relative flex flex-grow flex-col items-center justify-center px-4 py-16"
	style="background: linear-gradient(135deg, #f1f5f9 0%, #e8edf5 100%)"
>
	<!-- Subtle grid -->
	<div
		class="pointer-events-none absolute inset-0 opacity-40"
		style="background-image: linear-gradient(rgba(148,163,184,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.2) 1px, transparent 1px); background-size: 40px 40px;"
	></div>

	<!-- Card -->
	<div class="relative w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
		<h2 class="text-xl font-bold tracking-tight text-gray-900">{m.login_welcome_label()}</h2>
		<p class="mt-1 text-sm text-gray-500">{m.login_sign_in_desc()}</p>

		{#if form?.error}
			<div class="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
				{form.error}
			</div>
		{/if}

		<form class="mt-6 space-y-4" method="post" use:enhance>
			<div>
				<label class="mb-1.5 block text-sm font-medium text-gray-700" for="email">
					{m.login_email_label()}
				</label>
				<input
					autocomplete="email"
					bind:this={emailElement}
					class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition-colors focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
					id="email"
					name="email"
					placeholder="you@example.com"
					required
					type="email"
				/>
			</div>

			<div>
				<div class="mb-1.5 flex items-center justify-between">
					<label class="block text-sm font-medium text-gray-700" for="password">
						{m.login_password_label()}
					</label>
					<a
						class="text-xs text-blue-600 transition-colors hover:text-blue-700"
						href="/forgot-password"
					>
						{m.login_forgot_password()}
					</a>
				</div>
				<input
					autocomplete="current-password"
					class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition-colors focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
					id="password"
					name="password"
					placeholder="••••••••"
					required
					type="password"
				/>
			</div>

			<button
				class="group mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
				type="submit"
			>
				{m.login_sign_in_button()}
				<ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
			</button>
		</form>
	</div>

	<p class="relative mt-5 text-sm text-gray-500">
		{m.login_no_account()}
		<a class="font-medium text-blue-600 transition-colors hover:text-blue-700" href="/signup">
			{m.login_create_one()}
		</a>
	</p>
</div>
