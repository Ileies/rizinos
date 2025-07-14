<script lang="ts">
	import type { ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';

	let { form }: { form: ActionData } = $props();

	let emailElement: HTMLInputElement;

	onMount(() => {
		emailElement.focus();
	});
</script>

<div class="flex-grow flex items-center justify-center bg-base-200">
	<div class="card w-full max-w-lg md:max-w-xl lg:max-w-2xl shadow-2xl bg-base-100">
		<div class="card-body">
			<h2 class="card-title text-center text-3xl font-bold">Login</h2>

			{#if form?.error}
				<div class="alert alert-error shadow-lg mt-4">
					<div>
						<span class="font-semibold">Fehler:</span>
						<span>{form.error}</span>
					</div>
				</div>
			{/if}

			<!--<button onclick={()=>{}}>button</button>-->

			<form class="space-y-6" method="post" use:enhance>
				<!-- Email Input -->
				<div class="form-control">
					<label class="label" for="email">
						<span class="label-text">Email</span>
					</label>
					<input
						autocomplete="email"
						bind:this={emailElement}
						class="input input-bordered w-full"
						id="email"
						name="email"
						placeholder="example@mail.com"
						required
						type="email"
					/>
				</div>

				<!-- Password Input -->
				<div class="form-control">
					<label class="label" for="password">
						<span class="label-text">Passwort</span>
					</label>
					<input
						autocomplete="current-password"
						class="input input-bordered w-full"
						id="password"
						name="password"
						placeholder="••••••••"
						required
						type="password"
					/>
				</div>

				<!-- Submit Button -->
				<div class="form-control mt-4">
					<button class="btn btn-primary w-full" type="submit">
						Login
					</button>
				</div>
			</form>

			<!-- Additional Links -->
			<div class="text-center mt-6">
				<p class="text-sm">
					Noch kein Konto?
					<a class="text-primary hover:underline" href="/signup">Registrieren</a>
				</p>
				<p class="text-sm">
					<a class="text-primary hover:underline" href="/forgot-password">Passwort vergessen?</a>
				</p>
			</div>
		</div>
	</div>
</div>
