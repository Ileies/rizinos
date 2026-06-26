<script lang="ts">
	import { page } from '$app/state';
	import { ChevronDown, ExternalLink, Menu, X } from '@lucide/svelte';
	import { SiGithub } from '@icons-pack/svelte-simple-icons';
	import { goto } from '$app/navigation';
	import { PUBLIC_APP_NAME } from '$env/static/public';
	import { browser } from '$app/environment';
	import { github } from '$lib/config';
	import { setLocale } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages.js';

	// Navigation items with dropdowns
	const navItems = [
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

	let isMenuOpen = $state(false);
	let isScrolled = $state(false);
	let innerWidth = $state(0);
	let activeDropdown: string | null = $state(null);
	let isMobile = $derived(innerWidth <= 768);

	if (browser) {
		const handleScroll = () => (isScrolled = window.scrollY > 20);
		window.addEventListener('scroll', handleScroll);
	}

	function toggleDropdown(label: string) {
		activeDropdown = activeDropdown === label ? null : label;
	}

	function closeDropdowns() {
		activeDropdown = null;
	}
</script>

<svelte:window bind:innerWidth />

<header
	class="sticky top-0 z-50 w-full transition-all duration-300 {isScrolled
		? 'bg-white-80 bg-transparent shadow-lg backdrop-blur-lg'
		: ''}"
>
	<div class="container mx-auto px-4">
		<nav class="flex h-20 items-center justify-between">
			<!-- Logo -->
			<a
				class="from-primary to-secondary relative bg-gradient-to-r bg-clip-text text-2xl font-bold text-transparent"
				href="/"
			>
				{PUBLIC_APP_NAME}
				<div
					class="from-primary to-secondary absolute -bottom-1 left-0 h-0.5 w-full scale-x-0 transform bg-gradient-to-r transition-transform duration-300 hover:scale-x-100"
				></div>
			</a>

			<div>
				<button onclick={() => setLocale('en')}>en</button>
				<button onclick={() => setLocale('de')}>de</button>
				<button onclick={() => setLocale('ru')}>ru</button>
				<button onclick={() => setLocale('cn')}>cn</button>
			</div>

			<!-- Desktop Navigation -->
			{#if !isMobile}
				<div class="flex items-center space-x-8">
					{#each navItems as item (item.href)}
						<div
							class="group relative"
							onpointerenter={() => item.dropdown && toggleDropdown(item.label)}
							onpointerleave={closeDropdowns}
						>
							<a
								href={item.href}
								class="flex items-center space-x-1 py-2 text-gray-700 transition-colors duration-200 hover:text-gray-900"
								class:text-blue-600={page.url.pathname.startsWith(item.href)}
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
							</a>

							{#if item.dropdown && activeDropdown === item.label}
								<div
									class="absolute top-full left-1/2 mt-2 w-64 -translate-x-1/2 transform rounded-xl border border-gray-100 bg-white py-2 shadow-xl"
								>
									<!--transition:slide={{ duration: 200, easing: cubicInOut }}-->
									<div
										class="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 transform border-t border-l border-gray-100 bg-white"
									></div>
									{#each item.dropdown as dropItem (dropItem.href)}
										<a
											href={dropItem.href}
											class="hover:text-primary block px-4 py-2 text-gray-700 transition-colors duration-200 hover:bg-gray-50"
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
						class="space-x-2 text-gray-700 transition-colors duration-200 hover:text-gray-900"
						target="_blank"
						rel="noopener noreferrer"
					>
						<SiGithub size={20} />
					</a>

					<button
						class="from-primary to-secondary rounded-full bg-linear-to-r px-6 py-2.5 font-medium text-white
            transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 active:scale-100"
						onclick={() => goto('/app')}
					>
						{m.getting_started()}
					</button>
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
				class="absolute top-20 left-0 w-full border-t border-gray-100 bg-white/80 px-4 py-4 shadow-xl backdrop-blur-lg"
			>
				<!--transition:slide={{ duration: 200, easing: cubicInOut }}-->
				{#each navItems as item (item.label)}
					<div class="py-1">
						<button
							class="flex w-full items-center justify-between py-2 text-gray-700 hover:text-gray-900"
							onclick={() => toggleDropdown(item.label)}
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
										class="hover:text-primary block py-2 text-gray-600 transition-colors duration-200"
									>
										{dropItem.label}
									</a>
								{/each}
							</div>
						{/if}
					</div>
				{/each}

				<div class="my-4 h-px w-full bg-gray-100"></div>

				<a
					href={github}
					class="flex items-center space-x-2 py-2 text-gray-700 hover:text-gray-900"
					target="_blank"
					rel="noopener noreferrer"
				>
					<Github size={20} />
					<span>GitHub</span>
					<ExternalLink size={14} class="text-gray-400" />
				</a>

				<button
					class="from-primary to-secondary hover:shadow-primary/25 mt-4 w-full rounded-full bg-gradient-to-r px-6 py-3 font-medium
          text-white transition-all duration-200 hover:shadow-lg"
					onclick={() => goto('/app')}
				>
					{m.getting_started()}
				</button>
			</div>
		{/if}
	</div>
</header>
