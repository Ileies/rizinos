<script lang="ts">
	import { ArrowRight, Eye, EyeOff, ExternalLink } from '@lucide/svelte';
	import { fade } from 'svelte/transition';
	import { browser } from '$app/environment';
	import * as m from '$lib/messages';

	let { loggedIn = false }: { loggedIn?: boolean } = $props();

	type Step = 'idle' | 'username' | 'birthdate' | 'finish' | 'confirm';

	let step = $state('idle' as Step);
	let username = $state('');
	let agreedToTos = $state(false);
	let tosError = $state(false);
	let birthdate = $state('');
	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let submitting = $state(false);
	let usernameError = $state('');
	let birthdateError = $state('');
	let emailError = $state('');
	let passwordError = $state('');

	const providers: Record<string, { label: string; url: string }> = {
		'gmail.com': { label: 'Open Gmail', url: 'https://mail.google.com' },
		'googlemail.com': { label: 'Open Gmail', url: 'https://mail.google.com' },
		'outlook.com': { label: 'Open Outlook', url: 'https://outlook.live.com' },
		'hotmail.com': { label: 'Open Outlook', url: 'https://outlook.live.com' },
		'live.com': { label: 'Open Outlook', url: 'https://outlook.live.com' },
		'msn.com': { label: 'Open Outlook', url: 'https://outlook.live.com' },
		'yahoo.com': { label: 'Open Yahoo Mail', url: 'https://mail.yahoo.com' },
		'ymail.com': { label: 'Open Yahoo Mail', url: 'https://mail.yahoo.com' },
		'icloud.com': { label: 'Open iCloud Mail', url: 'https://www.icloud.com/mail' },
		'me.com': { label: 'Open iCloud Mail', url: 'https://www.icloud.com/mail' },
		'mac.com': { label: 'Open iCloud Mail', url: 'https://www.icloud.com/mail' },
		'protonmail.com': { label: 'Open Proton Mail', url: 'https://mail.proton.me' },
		'proton.me': { label: 'Open Proton Mail', url: 'https://mail.proton.me' }
	};

	let emailProvider = $derived(providers[email.split('@')[1]?.toLowerCase() ?? ''] ?? null);

	function isOverlayOpen() {
		return step === 'birthdate' || step === 'finish' || step === 'confirm';
	}

	$effect(() => {
		if (!browser) return;
		document.body.style.overflow = isOverlayOpen() ? 'hidden' : '';
		return () => {
			document.body.style.overflow = '';
		};
	});

	function nextFromUsername() {
		usernameError = '';
		const trimmed = username.trim();
		if (!trimmed) {
			usernameError = m.signup_username_required();
			return;
		}
		if (trimmed.length < 3) {
			usernameError = m.signup_username_too_short();
			return;
		}
		if (trimmed.length > 20) {
			usernameError = m.signup_username_too_long();
			return;
		}
		if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
			usernameError = m.signup_username_invalid_chars();
			return;
		}
		if (!agreedToTos) {
			tosError = true;
			return;
		}
		step = 'birthdate';
	}

	function nextFromBirthdate() {
		birthdateError = '';
		if (!birthdate) {
			birthdateError = m.signup_birthdate_required();
			return;
		}
		const parsed = new Date(birthdate);
		if (isNaN(parsed.getTime())) {
			birthdateError = m.signup_birthdate_invalid();
			return;
		}
		if (parsed.getTime() > Date.now()) {
			birthdateError = m.signup_birthdate_future();
			return;
		}
		const ageMs = Date.now() - parsed.getTime();
		if (ageMs < 13 * 365.25 * 24 * 60 * 60 * 1000) {
			birthdateError = m.signup_age_requirement();
			return;
		}
		step = 'finish';
	}

	async function nextFromFinish() {
		emailError = '';
		passwordError = '';
		let ok = true;
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			emailError = m.signup_email_invalid();
			ok = false;
		}
		if (password.length < 8) {
			passwordError = m.signup_password_too_short();
			ok = false;
		}
		if (!ok) return;
		submitting = true;
		// TODO: wire to signup API
		await new Promise((r) => setTimeout(r, 700));
		submitting = false;
		step = 'confirm';
	}

	const dockColors = [
		'from-primary to-primary/60',
		'from-gray-500 to-gray-700',
		'from-orange-400 to-red-500',
		'from-yellow-400 to-amber-600',
		'from-green-400 to-emerald-600'
	];
</script>

<!-- Inline: idle or username -->
<div class="flex flex-col items-center">
	{#if step === 'idle'}
		{#if loggedIn}
			<a
				href="/app"
				class="group inline-flex items-center gap-2 rounded-lg bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
			>
				{m.signup_open_your_os()}
				<ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
			</a>
		{:else}
			<button
				onclick={() => (step = 'username')}
				class="group inline-flex items-center gap-2 rounded-lg bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
			>
				{m.signup_open_rizinos()}
				<ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
			</button>
		{/if}
	{:else if step === 'username'}
		<div class="w-full max-w-xs">
			<div class="flex gap-2">
				<input
					type="text"
					placeholder={m.signup_username_placeholder()}
					bind:value={username}
					onkeydown={(e) => e.key === 'Enter' && nextFromUsername()}
					autofocus
					class="min-w-0 flex-1 rounded-lg border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none {usernameError
						? 'border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20'
						: 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'}"
				/>
				<button
					onclick={nextFromUsername}
					class="flex-shrink-0 rounded-lg bg-primary px-4 py-3 text-primary-foreground transition-colors hover:bg-primary/90"
					aria-label={m.signup_continue()}
				>
					<ArrowRight class="h-4 w-4" />
				</button>
			</div>
			{#if usernameError}
				<p class="mt-1.5 text-xs text-destructive">{usernameError}</p>
			{/if}
			<label class="mt-3 flex cursor-pointer items-start gap-2.5">
				<input
					type="checkbox"
					bind:checked={agreedToTos}
					onchange={() => {
						if (agreedToTos) tosError = false;
					}}
					class="mt-0.5 h-3.5 w-3.5 flex-shrink-0 rounded"
					style="accent-color: {tosError ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}"
				/>
				<span class="text-xs leading-snug {tosError ? 'text-destructive' : 'text-muted-foreground'}">
					{m.signup_tos_prefix()}
					<a href="/terms" class="underline hover:text-foreground">{m.terms_of_service()}</a>
					{m.signup_tos_and()}
					<a href="/privacy" class="underline hover:text-foreground">{m.privacy_policy()}</a>{m.signup_tos_suffix()}
				</span>
			</label>
		</div>
	{/if}

	<p class="mt-4 text-xs text-muted-foreground">
		{m.signup_free_note()}
	</p>
</div>

<!-- OS mock overlay: birthdate / finish / confirm -->
{#if isOverlayOpen()}
	<div transition:fade={{ duration: 180 }} class="fixed inset-0 z-50 overflow-hidden">
		<!-- Desktop -->
		<div
			class="absolute inset-0"
			style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 60%, #1e1b4b 100%)"
		></div>

		<!-- Ghost windows -->
		<div
			class="absolute left-[8%] top-[10%] h-44 w-72 rounded-xl border border-white/10 bg-white/[0.04] opacity-60"
		></div>
		<div
			class="absolute right-[6%] top-[18%] h-36 w-56 rounded-xl border border-white/10 bg-white/[0.04] opacity-60"
		></div>
		<div
			class="absolute bottom-[18%] left-[4%] h-28 w-44 rounded-xl border border-white/10 bg-white/[0.04] opacity-40"
		></div>

		<!-- Desktop icons -->
		<div class="absolute left-4 top-4 flex flex-col gap-1 opacity-30 select-none">
			{#each ['Files', 'Terminal', 'Notes'] as icon}
				<div class="flex items-center gap-2 rounded-lg px-2 py-1.5">
					<div class="h-8 w-8 rounded-lg bg-primary shadow-sm"></div>
					<span class="text-xs font-medium text-white">{icon}</span>
				</div>
			{/each}
		</div>

		<!-- Scrim -->
		<div class="absolute inset-0 bg-black/50"></div>

		<!-- Dock -->
		<div
			class="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-2 border-t border-white/10 bg-black/40 py-2.5 backdrop-blur-md"
		>
			{#each dockColors as g}
				<div class="h-8 w-8 rounded-lg bg-gradient-to-br {g} opacity-40 shadow-sm"></div>
			{/each}
		</div>

		<!-- Dialog -->
		<div class="absolute inset-0 flex items-center justify-center p-4">
			<div
				class="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
			>
				<div class="flex items-center gap-1.5 border-b border-border bg-muted px-4 py-3">
					<div class="h-2.5 w-2.5 rounded-full bg-muted-foreground/30"></div>
					<div class="h-2.5 w-2.5 rounded-full bg-muted-foreground/30"></div>
					<div class="h-2.5 w-2.5 rounded-full bg-muted-foreground/30"></div>
				</div>

				<div class="p-8">
					{#if step === 'birthdate'}
						<h2 class="text-2xl font-black tracking-tight text-foreground">
							{m.signup_welcome({ username })}
						</h2>
						<p class="mt-1.5 text-sm text-muted-foreground">{m.signup_birthdate_prompt()}</p>
						<input
							type="date"
							bind:value={birthdate}
							class="mt-5 w-full rounded-lg border border-border px-4 py-3 text-sm text-foreground bg-background outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
						/>
						{#if birthdateError}
							<p class="mt-1.5 text-xs text-destructive">{birthdateError}</p>
						{/if}
						<button
							onclick={nextFromBirthdate}
							class="mt-5 w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
						>
							{m.signup_continue()}
						</button>

					{:else if step === 'finish'}
						<h2 class="text-2xl font-black tracking-tight text-foreground">{m.signup_finish_title()}</h2>
						<p class="mt-1.5 text-sm text-muted-foreground">
							{m.signup_finish_desc()}
						</p>
						<div class="mt-5 space-y-3">
							<div>
								<input
									type="email"
									placeholder={m.signup_email_placeholder()}
									bind:value={email}
									class="w-full rounded-lg border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground bg-background outline-none {emailError
										? 'border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20'
										: 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'}"
								/>
								{#if emailError}
									<p class="mt-1 text-xs text-destructive">{emailError}</p>
								{/if}
							</div>
							<div>
								<div class="relative">
									<input
										type={showPassword ? 'text' : 'password'}
										placeholder={m.signup_password_placeholder()}
										bind:value={password}
										class="w-full rounded-lg border px-4 py-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground bg-background outline-none {passwordError
											? 'border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20'
											: 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'}"
									/>
									<button
										type="button"
										onclick={() => (showPassword = !showPassword)}
										class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
										aria-label={showPassword ? m.signup_hide_password() : m.signup_show_password()}
									>
										{#if showPassword}
											<EyeOff class="h-4 w-4" />
										{:else}
											<Eye class="h-4 w-4" />
										{/if}
									</button>
								</div>
								{#if passwordError}
									<p class="mt-1 text-xs text-destructive">{passwordError}</p>
								{/if}
							</div>
						</div>
						<button
							onclick={nextFromFinish}
							disabled={submitting}
							class="mt-5 w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{submitting ? m.signup_creating() : m.signup_create_account()}
						</button>

					{:else if step === 'confirm'}
						<div class="text-center">
							<p class="mb-3 text-4xl">🎉</p>
							<h2 class="text-2xl font-black tracking-tight text-foreground">{m.signup_thanks_title()}</h2>
							<p class="mt-3 text-sm text-muted-foreground">{m.signup_confirm_sent()}</p>
							<p class="mt-1 text-sm font-semibold text-foreground">{email}</p>
							{#if emailProvider}
								<a
									href={emailProvider.url}
									target="_blank"
									rel="noopener noreferrer"
									class="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
								>
									{emailProvider.label}
									<ExternalLink class="h-3.5 w-3.5" />
								</a>
							{/if}
							<p class="mt-4 text-xs text-muted-foreground">
								{m.signup_check_spam()}
							</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
