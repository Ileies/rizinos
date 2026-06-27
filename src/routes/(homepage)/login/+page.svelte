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

<div class="relative flex flex-grow flex-col items-center justify-center px-4 py-16 bg-background">
	<!-- Subtle grid -->
	<div
		class="pointer-events-none absolute inset-0 opacity-40"
		style="background-image: linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px); background-size: 40px 40px;"
	></div>

	<!-- Card -->
	<div class="relative w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
		<h2 class="text-xl font-bold tracking-tight text-card-foreground">{m.login_welcome_label()}</h2>
		<p class="mt-1 text-sm text-muted-foreground">{m.login_sign_in_desc()}</p>

		{#if form?.error}
			<div class="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
				{form.error}
			</div>
		{/if}

		<form class="mt-6 space-y-4" method="post" use:enhance>
			<div>
				<label class="mb-1.5 block text-sm font-medium text-foreground" for="email">
					{m.login_email_label()}
				</label>
				<input
					autocomplete="email"
					bind:this={emailElement}
					class="w-full rounded-lg border border-input bg-muted px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground transition-colors focus:border-ring focus:bg-background focus:ring-2 focus:ring-ring/20"
					id="email"
					name="email"
					placeholder="you@example.com"
					required
					type="email"
				/>
			</div>

			<div>
				<label class="mb-1.5 block text-sm font-medium text-foreground" for="password">
					{m.login_password_label()}
				</label>
				<input
					autocomplete="current-password"
					class="w-full rounded-lg border border-input bg-muted px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground transition-colors focus:border-ring focus:bg-background focus:ring-2 focus:ring-ring/20"
					id="password"
					name="password"
					placeholder="••••••••"
					required
					type="password"
				/>
				<a
					class="mt-1.5 block text-xs text-primary transition-colors hover:text-primary/80"
					href="/forgot-password"
					tabindex="-1"
				>
					{m.login_forgot_password()}
				</a>
			</div>

			<button
				class="group mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
				type="submit"
			>
				{m.login_sign_in_button()}
				<ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
			</button>
		</form>
	</div>

	<p class="relative mt-5 text-sm text-muted-foreground">
		{m.login_no_account()}
		<a class="font-medium text-primary transition-colors hover:text-primary/80" href="/signup">
			{m.login_create_one()}
		</a>
	</p>
</div>
