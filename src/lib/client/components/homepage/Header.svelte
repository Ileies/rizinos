<script lang="ts">
	import { page } from '$app/state';
	import { ChevronDown, ExternalLink, Menu, X, Globe } from '@lucide/svelte';
	import { SiGithub } from '@icons-pack/svelte-simple-icons';
	import { goto } from '$app/navigation';
	import { PUBLIC_APP_NAME } from '$env/static/public';
	import { browser } from '$app/environment';
	import { github } from '$lib/config';
	import { setLocale, locale as localeStore } from '$lib/messages';
	import * as m from '$lib/messages';

	const languages = [
		{ code: 'en', name: 'English', flag: '🇬🇧' },
		{ code: 'de', name: 'Deutsch', flag: '🇩🇪' },
		{ code: 'ru', name: 'Русский', flag: '🇷🇺' },
		{ code: 'cn', name: '简体中文', flag: '🇨🇳' }
	];

	let navItems = $derived((() => {
		$localeStore;
		return [
			{
				label: m.features(),
				href: '/features',
				dropdown: [
					{ label: m.overview(), href: '/features' },
					{ label: m.performance(), href: '/features/performance' },
					{ label: m.security(), href: '/features/security' },
					{ label: m.integration(), href: '/features/integration' }
				]
			},
			{
				label: m.documentation(),
				href: '/docs',
				dropdown: [
					{ label: m.getting_started(), href: '/docs/getting-started' },
					{ label: m.api_reference(), href: '/docs/api' },
					{ label: m.tutorials(), href: '/docs/tutorials' }
				]
			},
			{ label: m.pricing(), href: '/pricing' },
			{ label: m.enterprise(), href: '/enterprise' }
		];
	})());

	let { loggedIn = false }: { loggedIn?: boolean } = $props();

	let isMenuOpen = $state(false);
	let isScrolled = $state(false);
	let innerWidth = $state(0);
	let activeDropdown: string | null = $state(null);
	let isLanguageDropdownOpen = $state(false);
	let isMobile = $derived(innerWidth <= 768);

	if (browser) {
		const handleScroll = () => (isScrolled = window.scrollY > 20);
		window.addEventListener('scroll', handleScroll);
	}

	function toggleDropdown(e: MouseEvent, label: string) {
		e.stopPropagation();
		activeDropdown = activeDropdown === label ? null : label;
		isLanguageDropdownOpen = false;
	}

	function toggleLanguageDropdown(e: MouseEvent) {
		e.stopPropagation();
		isLanguageDropdownOpen = !isLanguageDropdownOpen;
		activeDropdown = null;
	}

	function stopPropagation(e: MouseEvent) {
		e.stopPropagation();
	}

	function closeAll() {
		activeDropdown = null;
		isLanguageDropdownOpen = false;
	}

	function selectLanguage(code: string) {
		setLocale(code);
		isLanguageDropdownOpen = false;
	}
</script>

<svelte:window bind:innerWidth />
<svelte:document onclick={closeAll} />

<header
	class="sticky top-0 z-50 w-full border-b bg-white transition-all duration-200 {isScrolled
		? 'border-gray-200'
		: 'border-transparent'}"
>
	<div class="container mx-auto px-4">
		<nav class="flex h-20 items-center justify-between">
			<!-- Logo -->
			<a class="flex items-center gap-2" href="/">
				<img src="/favicon.png" alt={PUBLIC_APP_NAME} class="h-8 w-8" />
				<span class="text-xl font-black tracking-tight text-gray-900">{PUBLIC_APP_NAME}</span>
			</a>

			<!-- Desktop Navigation -->
			{#if !isMobile}
				<div class="flex items-center space-x-8">
					{#each navItems as item (item.href)}
						<div class="relative">
							{#if item.dropdown}
								<button
									onclick={(e) => toggleDropdown(e, item.label)}
									class="flex items-center space-x-1 py-2 text-gray-700 transition-colors duration-200 hover:text-gray-900"
									class:text-blue-600={page.url.pathname.startsWith(item.href)}
								>
									<span>{item.label}</span>
									<ChevronDown
										size={16}
										class="transition-transform duration-200 {activeDropdown === item.label
											? 'rotate-180'
											: ''}"
									/>
								</button>
							{:else}
								<a
									href={item.href}
									class="flex items-center py-2 text-gray-700 transition-colors duration-200 hover:text-gray-900"
									class:text-blue-600={page.url.pathname.startsWith(item.href)}
								>
									{item.label}
								</a>
							{/if}

							{#if item.dropdown && activeDropdown === item.label}
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div
									onclick={stopPropagation}
									class="absolute top-full left-1/2 mt-2 w-56 -translate-x-1/2 rounded-xl border border-gray-100 bg-white py-2 shadow-xl"
								>
									<div
										class="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-l border-t border-gray-100 bg-white"
									></div>
									{#each item.dropdown as dropItem (dropItem.href)}
										<a
											href={dropItem.href}
											onclick={closeAll}
											class="block px-4 py-2 text-gray-700 transition-colors duration-200 hover:bg-gray-50 hover:text-gray-900"
										>
											{dropItem.label}
										</a>
									{/each}
								</div>
							{/if}
						</div>
					{/each}

					<a
						href={github}
						class="text-gray-400 transition-colors hover:text-gray-600"
						target="_blank"
						rel="noopener noreferrer"
					>
						<SiGithub size={18} />
					</a>

					<!-- Language Switcher -->
					<div class="relative">
						<button
							onclick={toggleLanguageDropdown}
							class="p-2 text-gray-500 transition-colors duration-200 hover:text-gray-900"
							aria-label="Select language"
						>
							<Globe size={18} />
						</button>

						{#if isLanguageDropdownOpen}
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								onclick={stopPropagation}
								class="absolute top-full right-0 mt-2 w-48 rounded-xl border border-gray-100 bg-white py-2 shadow-xl z-50"
							>
								{#each languages as lang (lang.code)}
									<button
										onclick={() => selectLanguage(lang.code)}
										class="w-full px-4 py-3 flex items-center space-x-3 text-gray-700 transition-colors duration-200 hover:bg-gray-50 hover:text-gray-900 text-left"
									>
										<span class="text-lg">{lang.flag}</span>
										<span>{lang.name}</span>
									</button>
								{/each}
							</div>
						{/if}
					</div>

					{#if loggedIn}
						<a
							href="/app"
							class="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
						>
							{m.open_your_os()}
						</a>
					{:else}
						<a
							href="/login"
							class="rounded-lg border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50"
						>
							{m.log_in()}
						</a>
					{/if}
				</div>
			{:else}
				<!-- Mobile Menu Button -->
				<button
					onclick={() => (isMenuOpen = !isMenuOpen)}
					class="p-2 text-gray-600 transition-colors duration-200 hover:text-gray-900"
					aria-label="Toggle menu"
				>
					{#if isMenuOpen}
						<X size={24} />
					{:else}
						<Menu size={24} />
					{/if}
				</button>
			{/if}
		</nav>

		<!-- Mobile Navigation -->
		{#if isMobile && isMenuOpen}
			<div
				class="absolute top-20 left-0 w-full border-t border-gray-200 bg-white px-4 py-4 shadow-lg"
			>
				{#each navItems as item (item.label)}
					<div class="py-1">
						<button
							class="flex w-full items-center justify-between py-2 text-gray-700 hover:text-gray-900"
							onclick={(e) => toggleDropdown(e, item.label)}
						>
							<span>{item.label}</span>
							{#if item.dropdown}
								<ChevronDown
									size={16}
									class="transition-transform duration-200 {activeDropdown === item.label
										? 'rotate-180'
										: ''}"
								/>
							{/if}
						</button>

						{#if item.dropdown && activeDropdown === item.label}
							<div class="mt-2 ml-4 space-y-2 border-l-2 border-gray-100 pl-4">
								{#each item.dropdown as dropItem (dropItem.href)}
									<a
										href={dropItem.href}
										class="block py-2 text-gray-600 transition-colors duration-200 hover:text-gray-900"
									>
										{dropItem.label}
									</a>
								{/each}
							</div>
						{/if}
					</div>
				{/each}

				<div class="my-4 h-px w-full bg-gray-100"></div>

				<!-- Mobile Language Switcher -->
				<div class="py-1">
					<button
						class="flex w-full items-center justify-between py-2 text-gray-700 hover:text-gray-900"
						onclick={toggleLanguageDropdown}
					>
						<span class="flex items-center space-x-2">
							<Globe size={16} />
							<span>{m.language()}</span>
						</span>
						<ChevronDown
							size={16}
							class="transition-transform duration-200 {isLanguageDropdownOpen ? 'rotate-180' : ''}"
						/>
					</button>
					{#if isLanguageDropdownOpen}
						<div class="mt-2 ml-4 space-y-1 border-l-2 border-gray-100 pl-4">
							{#each languages as lang (lang.code)}
								<button
									onclick={() => selectLanguage(lang.code)}
									class="flex w-full items-center space-x-3 py-2 text-gray-600 hover:text-gray-900 text-left"
								>
									<span>{lang.flag}</span>
									<span>{lang.name}</span>
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<div class="my-4 h-px w-full bg-gray-100"></div>

				<a
					href={github}
					class="flex items-center space-x-2 py-2 text-gray-700 hover:text-gray-900"
					target="_blank"
					rel="noopener noreferrer"
				>
					<SiGithub size={20} />
					<span>GitHub</span>
					<ExternalLink size={14} class="text-gray-400" />
				</a>

				{#if loggedIn}
					<a
						href="/app"
						class="mt-4 block w-full rounded-lg bg-blue-600 px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-700"
					>
						{m.open_your_os()}
					</a>
				{:else}
					<a
						href="/login"
						class="mt-4 block w-full rounded-lg border border-gray-300 px-6 py-3 text-center text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
					>
						{m.log_in()}
					</a>
				{/if}
			</div>
		{/if}
	</div>
</header>
