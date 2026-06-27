<script lang="ts">
	import type { ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import { type FormData, maxAge, minAge } from '$lib/formValidation';
	import { ArrowRight, ArrowLeft } from '@lucide/svelte';
	import * as m from '$lib/messages';

	let step = $state(1);
	const TOTAL_STEPS = 4;

	let firstInput: HTMLInputElement;

	const formData: FormData = $state({
		gender: 'male',
		birthdate: '',
		firstName: '',
		lastName: '',
		username: '',
		password: '',
		email: ''
	});

	let { form }: { form: ActionData } = $props();

	onMount(() => {
		firstInput?.focus();
	});

	const stepTitle = $derived(
		step === 1
			? m.signup_name_title()
			: step === 2
				? m.signup_birth_title()
				: step === 3
					? m.signup_account_title()
					: m.signup_finish_title()
	);

	const inputClass =
		'w-full rounded-lg border border-input bg-muted px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground transition-colors focus:border-ring focus:bg-background focus:ring-2 focus:ring-ring/20';
</script>

{#if form?.success}
	<div class="flex flex-grow flex-col items-center justify-center px-4 py-16 bg-background">
		<div class="relative w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm text-center">
			<h2 class="text-xl font-bold tracking-tight text-card-foreground">{m.signup_thanks_title()}</h2>
			<p class="mt-2 text-sm text-muted-foreground">{m.signup_confirm_sent()}</p>
			<p class="mt-1 text-sm font-medium text-foreground">{formData.email}</p>
			<p class="mt-3 text-xs text-muted-foreground">{m.signup_check_spam()}</p>
		</div>
	</div>
{:else}
	<div class="relative flex flex-grow flex-col items-center justify-center px-4 py-16 bg-background">
		<!-- Subtle grid -->
		<div
			class="pointer-events-none absolute inset-0 opacity-40"
			style="background-image: linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px); background-size: 40px 40px;"
		></div>

		<!-- Card -->
		<div class="relative w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
			<!-- Progress bar -->
			<div class="mb-5 flex gap-1.5">
				{#each { length: TOTAL_STEPS } as _, i}
					<div
						class="h-1 flex-1 rounded-full transition-colors {i < step
							? 'bg-primary'
							: 'bg-muted'}"
					></div>
				{/each}
			</div>

			<p class="text-xs font-medium text-muted-foreground">
				{m.signup_step({ step })} / {TOTAL_STEPS}
			</p>
			<h2 class="mt-1 text-xl font-bold tracking-tight text-card-foreground">{stepTitle}</h2>

			{#if form?.errors}
				<div
					class="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
				>
					{JSON.stringify(form.errors)}
				</div>
			{/if}

			<form class="mt-6" method="POST" use:enhance>
				<div class="space-y-4">
					<!-- Step 1: Name -->
					<div class:hidden={step !== 1} class="space-y-4">
						<div>
							<label class="mb-1.5 block text-sm font-medium text-foreground" for="firstName">
								{m.signup_first_name()}
							</label>
							<input
								bind:this={firstInput}
								bind:value={formData.firstName}
								autocomplete="given-name"
								class={inputClass}
								id="firstName"
								maxlength={50}
								name="firstName"
								placeholder={m.signup_first_name()}
								type="text"
							/>
						</div>
						<div>
							<label class="mb-1.5 block text-sm font-medium text-foreground" for="lastName">
								{m.signup_last_name()}
							</label>
							<input
								bind:value={formData.lastName}
								autocomplete="family-name"
								class={inputClass}
								id="lastName"
								maxlength={50}
								name="lastName"
								placeholder={m.signup_last_name()}
								type="text"
							/>
						</div>
					</div>

					<!-- Step 2: Birthdate & Gender -->
					<div class:hidden={step !== 2} class="space-y-4">
						<div>
							<label class="mb-1.5 block text-sm font-medium text-foreground" for="birthdate">
								{m.signup_birthdate_label()}
							</label>
							<input
								bind:value={formData.birthdate}
								autocomplete="bday"
								class={inputClass}
								id="birthdate"
								max={minAge}
								min={maxAge}
								name="birthdate"
								type="date"
							/>
						</div>
						<div>
							<p class="mb-2 text-sm font-medium text-foreground">{m.signup_gender_male()} / {m.signup_gender_female()}</p>
							<div class="flex gap-4">
								<label class="flex cursor-pointer items-center gap-2 text-sm text-foreground">
									<input
										bind:group={formData.gender}
										class="accent-primary"
										name="gender"
										type="radio"
										value="male"
									/>
									{m.signup_gender_male()}
								</label>
								<label class="flex cursor-pointer items-center gap-2 text-sm text-foreground">
									<input
										bind:group={formData.gender}
										class="accent-primary"
										name="gender"
										type="radio"
										value="female"
									/>
									{m.signup_gender_female()}
								</label>
							</div>
						</div>
					</div>

					<!-- Step 3: Account Details -->
					<div class:hidden={step !== 3} class="space-y-4">
						<div>
							<label class="mb-1.5 block text-sm font-medium text-foreground" for="email">
								{m.signup_email_label()}
							</label>
							<input
								bind:value={formData.email}
								autocomplete="email"
								class={inputClass}
								id="email"
								maxlength={32}
								minlength={10}
								name="email"
								placeholder={m.signup_email_placeholder()}
								type="email"
							/>
						</div>
						<div>
							<label class="mb-1.5 block text-sm font-medium text-foreground" for="username">
								{m.signup_username_label()}
							</label>
							<input
								bind:value={formData.username}
								class={inputClass}
								id="username"
								maxlength={20}
								minlength={5}
								name="username"
								placeholder={m.signup_username_placeholder()}
								type="text"
							/>
						</div>
					</div>

					<!-- Step 4: Password -->
					<div class:hidden={step !== 4} class="space-y-4">
						<div>
							<label class="mb-1.5 block text-sm font-medium text-foreground" for="password">
								{m.signup_password_label()}
							</label>
							<input
								bind:value={formData.password}
								autocomplete="new-password"
								class={inputClass}
								id="password"
								maxlength={71}
								minlength={10}
								name="password"
								placeholder={m.signup_password_placeholder()}
								type="password"
							/>
						</div>
						<div>
							<label class="mb-1.5 block text-sm font-medium text-foreground" for="confirmPassword">
								{m.signup_confirm_password()}
							</label>
							<input
								autocomplete="new-password"
								class={inputClass}
								id="confirmPassword"
								maxlength={71}
								minlength={10}
								placeholder={m.signup_confirm_password()}
								type="password"
							/>
						</div>
					</div>
				</div>

				<!-- Navigation -->
				<div class="mt-6 flex items-center {step > 1 ? 'justify-between' : 'justify-end'}">
					{#if step > 1}
						<button
							class="flex items-center gap-1.5 rounded-lg border border-input px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
							onclick={() => step--}
							type="button"
						>
							<ArrowLeft class="h-4 w-4" />
							{m.signup_back()}
						</button>
					{/if}

					{#if step < TOTAL_STEPS}
						<button
							class="group flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
							onclick={() => step++}
							type="button"
						>
							{m.signup_next()}
							<ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
						</button>
					{:else}
						<button
							class="group flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
							type="submit"
						>
							{m.signup_create_account()}
							<ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
						</button>
					{/if}
				</div>
			</form>
		</div>

		<p class="relative mt-5 text-sm text-muted-foreground">
			{m.signup_have_account()}
			<a class="font-medium text-primary transition-colors hover:text-primary/80" href="/login">
				{m.signup_log_in()}
			</a>
		</p>
	</div>
{/if}
