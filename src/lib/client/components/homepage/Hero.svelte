<script lang="ts">
	import {
		ArrowRight,
		Cpu,
		Layers,
		Download,
		Shield,
		Zap,
		Users,
		Check,
		Code2,
		Lock,
		Globe,
		Wifi
	} from '@lucide/svelte';
	import SignupFlow from '$ui/homepage/SignupFlow.svelte';
	import * as m from '$lib/messages';
	import { locale as localeStore } from '$lib/messages';

	let { loggedIn = false }: { loggedIn?: boolean } = $props();

	let features = $derived((() => {
		$localeStore;
		return [
			{ icon: Cpu, title: m.feature_rust_wasm_title(), description: m.feature_rust_wasm_desc() },
			{ icon: Layers, title: m.feature_nixos_title(), description: m.feature_nixos_desc() },
			{ icon: Shield, title: m.feature_encryption_title(), description: m.feature_encryption_desc() },
			{ icon: Zap, title: m.feature_instant_title(), description: m.feature_instant_desc() },
			{ icon: Download, title: m.feature_bgapp_title(), description: m.feature_bgapp_desc() },
			{ icon: Users, title: m.feature_collab_title(), description: m.feature_collab_desc() }
		];
	})());

	const apps = [
		{ name: 'Files', label: 'F' },
		{ name: 'Terminal', label: '>_' },
		{ name: 'Browser', label: 'B' },
		{ name: 'Notes', label: 'N' },
		{ name: 'Mail', label: 'M' },
		{ name: 'Chat', label: 'C' },
		{ name: 'Calendar', label: 'Ca' },
		{ name: 'Photos', label: 'Ph' },
		{ name: 'Video', label: 'V' },
		{ name: 'Music', label: 'Mu' },
		{ name: 'Settings', label: 'S' },
		{ name: 'Store', label: 'St' }
	];

	let syncFeatures = $derived((() => {
		$localeStore;
		return [
			m.sync_bidirectional(),
			m.sync_native_dnd(),
			m.sync_backups(),
			m.sync_push_notif(),
			m.sync_peripherals(),
			m.sync_offline()
		];
	})());

	let bridgeCaps = $derived((() => {
		$localeStore;
		return [
			m.cap_file_sync(),
			m.cap_cloud_backup(),
			m.cap_notifications(),
			m.cap_offline_mode(),
			m.cap_peripherals(),
			m.cap_usb_access()
		];
	})());

	let zeroErrorsItems = $derived((() => {
		$localeStore;
		return [
			{ title: m.hardware_independent_title(), desc: m.hardware_independent_desc() },
			{ title: m.declarative_config_title(), desc: m.declarative_config_desc() },
			{ title: m.atomic_updates_title(), desc: m.atomic_updates_desc() }
		];
	})());

	const layers = [
		{ label: 'Applications', sub: 'Files · Terminal · Browser · Notes · Chat · Mail · Calendar...' },
		{ label: 'System Shell', sub: 'Window manager · Dock · Notifications · Permissions UI' },
		{ label: 'OS Services', sub: 'Auth · Storage · Networking · IPC bus · Event system' },
		{ label: 'Rust WASM Kernel', sub: 'Scheduling · Memory isolation · Crypto · Compression' },
		{ label: 'Browser Runtime', sub: 'WebAssembly · Web APIs · WebGL · WebRTC · WebSockets' }
	];
</script>

<div class="flex w-full flex-col">
	<!-- ===================================================
	     HERO
	     =================================================== -->
	<section class="border-b border-border bg-background px-6 py-24 lg:py-36">
		<div class="mx-auto max-w-4xl text-center">
				<h1 class="text-5xl font-black leading-[1.08] tracking-tight text-foreground lg:text-7xl">
				{m.hero_title()}
			</h1>

			<p class="mt-4 font-mono text-xs text-muted-foreground">public beta · v11.0.0</p>

			<p class="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
				{m.hero_subtitle()}
			</p>

			<div class="mt-10">
				<SignupFlow {loggedIn} />
			</div>
		</div>

		<!-- OS Mockup -->
		<div class="mx-auto mt-20 max-w-5xl">
			<div
				class="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_32px_80px_rgba(0,0,0,0.12)]"
			>
				<!-- Browser bar -->
				<div class="flex items-center gap-2 border-b border-border bg-muted px-4 py-3">
					<div class="flex gap-1.5">
						<div class="h-3 w-3 rounded-full bg-gray-300"></div>
						<div class="h-3 w-3 rounded-full bg-gray-300"></div>
						<div class="h-3 w-3 rounded-full bg-gray-300"></div>
					</div>
					<div
						class="mx-3 flex flex-1 items-center gap-2 rounded-md bg-background px-3 py-1.5 text-xs text-muted-foreground shadow-sm ring-1 ring-border"
					>
						<Lock class="h-3 w-3 text-green-500" />
						rizinos.com/app
					</div>
				</div>

				<!-- Desktop surface -->
				<div class="relative h-[380px] overflow-hidden bg-slate-100 lg:h-[480px]">
					<!-- Desktop background pattern -->
					<div
						class="absolute inset-0"
						style="background: linear-gradient(135deg, #e8edf5 0%, #dde4f0 100%)"
					></div>

					<!-- Desktop icons -->
					<div class="absolute left-4 top-4 flex flex-col gap-1">
						{#each ['Files', 'Terminal', 'Browser', 'Notes'] as icon}
							<div
								class="flex cursor-default items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/40"
							>
								<div class="h-8 w-8 rounded-lg bg-primary shadow-sm"></div>
								<span class="text-xs font-medium text-foreground/70">{icon}</span>
							</div>
						{/each}
					</div>

					<!-- Window: Files -->
					<div
						class="absolute left-24 top-8 hidden w-64 overflow-hidden rounded-xl border border-border bg-card shadow-xl sm:block lg:w-80"
					>
						<div class="flex items-center gap-2 border-b border-border bg-muted px-4 py-2.5">
							<div class="flex gap-1.5">
								<div class="h-2.5 w-2.5 rounded-full bg-muted-foreground/30"></div>
								<div class="h-2.5 w-2.5 rounded-full bg-muted-foreground/30"></div>
								<div class="h-2.5 w-2.5 rounded-full bg-muted-foreground/30"></div>
							</div>
							<span class="ml-2 text-xs font-medium text-muted-foreground">Files</span>
						</div>
						<div class="divide-y divide-border">
							{#each ['Documents', 'Downloads', 'Pictures', 'Music', 'Projects'] as folder}
								<div
									class="flex cursor-default items-center gap-3 px-4 py-2.5 hover:bg-accent"
								>
									<div class="h-4 w-4 rounded bg-primary/80"></div>
									<span class="text-sm text-foreground/80">{folder}</span>
								</div>
							{/each}
						</div>
					</div>

					<!-- Window: Terminal -->
					<div
						class="absolute right-4 top-10 hidden w-52 overflow-hidden rounded-xl border border-gray-300 bg-gray-900 shadow-xl sm:right-8 sm:block lg:w-64"
					>
						<div
							class="flex items-center gap-2 border-b border-gray-700 bg-gray-800 px-4 py-2.5"
						>
							<div class="flex gap-1.5">
								<div class="h-2.5 w-2.5 rounded-full bg-gray-600"></div>
								<div class="h-2.5 w-2.5 rounded-full bg-gray-600"></div>
								<div class="h-2.5 w-2.5 rounded-full bg-gray-600"></div>
							</div>
							<span class="ml-2 font-mono text-xs text-gray-400">bash</span>
						</div>
						<div class="p-4 font-mono text-xs leading-relaxed">
							<div class="text-gray-500">user@rizinos ~ %</div>
							<div class="text-gray-300">uname -a</div>
							<div class="text-gray-500">RizinOS 11.0.0 wasm64</div>
							<div class="text-gray-500">Kernel: rzk-wasm-rust</div>
							<div class="mt-2 text-gray-500">
								user@rizinos ~ % <span class="animate-pulse text-gray-300">|</span>
							</div>
						</div>
					</div>

					<!-- Notification -->
					<div
						class="absolute left-1/2 top-4 hidden -translate-x-1/2 items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 shadow-lg sm:flex lg:w-64"
					>
						<div class="h-7 w-7 flex-shrink-0 rounded-lg bg-green-500"></div>
						<div class="text-xs text-foreground/70">{m.mock_sync_complete()}</div>
					</div>

					<!-- Dock -->
					<div
						class="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-border bg-background/80 px-6 py-2 backdrop-blur-md"
					>
						<div class="flex items-center gap-2">
							{#each Array(6) as _, i}
								<div
									class="h-8 w-8 rounded-lg bg-primary shadow-sm transition-transform hover:scale-110 {i === 0 || i === 2 ? 'ring-2 ring-primary/30' : ''}"
								></div>
							{/each}
						</div>
						<div class="font-mono text-xs text-muted-foreground">12:34</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- ===================================================
	     ZERO ERRORS
	     =================================================== -->
	<section class="bg-muted/50 px-6 py-24">
		<div class="mx-auto max-w-7xl">
			<div class="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
				<div>
					<p class="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
						{m.core_promise_label()}
					</p>
					<h2 class="text-4xl font-black leading-tight tracking-tight text-foreground lg:text-5xl">
						{m.zero_errors_title()}
					</h2>
					<p class="mt-5 text-lg leading-relaxed text-muted-foreground">
						{m.zero_errors_desc()}
					</p>
				</div>

				<div class="grid grid-cols-1 gap-4">
					{#each zeroErrorsItems as item}
						<div class="rounded-xl border border-border bg-card p-6">
							<h3 class="mb-2 font-semibold text-foreground">{item.title}</h3>
							<p class="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<!-- ===================================================
	     FEATURES
	     =================================================== -->
	<section class="bg-background px-6 py-24">
		<div class="mx-auto max-w-7xl">
			<div class="mb-16 max-w-xl">
				<p class="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
					{m.capabilities_label()}
				</p>
				<h2 class="text-4xl font-black tracking-tight text-foreground">
					{m.features_era_title()}
				</h2>
			</div>

			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each features as feature}
					{@const Icon = feature.icon}
					<div
						class="rounded-xl border border-border bg-card p-7 transition-shadow hover:shadow-md"
					>
						<div
							class="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-secondary"
						>
							<Icon class="h-5 w-5 text-primary" />
						</div>
						<h3 class="mb-2 font-semibold text-foreground">{feature.title}</h3>
						<p class="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- ===================================================
	     BACKGROUND APP
	     =================================================== -->
	<section class="border-y border-border bg-muted/50 px-6 py-24">
		<div class="mx-auto max-w-7xl">
			<div class="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
				<div>
					<p class="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
						{m.bg_app_label()}
					</p>
					<h2 class="text-4xl font-black leading-tight tracking-tight text-foreground">
						{m.bg_app_title()}
					</h2>
					<p class="mt-5 text-lg leading-relaxed text-muted-foreground">
						{m.bg_app_desc()}
					</p>
					<div class="mt-8 space-y-3">
						{#each syncFeatures as item}
							<div class="flex items-start gap-3">
								<Check class="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
								<span class="text-sm text-muted-foreground">{item}</span>
							</div>
						{/each}
					</div>
					<div class="mt-10 flex flex-wrap gap-3">
						{#each ['Linux', 'macOS', 'Windows'] as platform}
							<button
								class="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:border-border hover:bg-muted"
							>
								{m.download_for({ platform })}
							</button>
						{/each}
					</div>
				</div>

				<!-- Bridge diagram -->
				<div class="rounded-xl border border-border bg-card p-8 shadow-sm">
					<div class="flex flex-col items-stretch gap-3">
						<div class="rounded-lg border border-primary/20 bg-secondary p-5">
							<div class="flex items-center gap-3">
								<Globe class="h-5 w-5 text-primary" />
								<div>
									<div class="text-sm font-semibold text-foreground">{m.bridge_browser()}</div>
									<div class="text-xs text-muted-foreground">rizinos.com/app</div>
								</div>
								<div class="ml-auto h-2 w-2 rounded-full bg-green-400"></div>
							</div>
						</div>

						<div class="flex flex-col items-center gap-0.5 py-1">
							<div class="h-6 w-px bg-border"></div>
							<div
								class="rounded-full border border-border bg-card px-4 py-1 text-xs text-muted-foreground"
							>
								{m.bridge_encrypted()}
							</div>
							<div class="h-6 w-px bg-border"></div>
						</div>

						<div class="rounded-lg border border-border bg-muted p-5">
							<div class="flex items-center gap-3">
								<Wifi class="h-5 w-5 text-muted-foreground" />
								<div>
									<div class="text-sm font-semibold text-foreground">{m.bg_app_label()}</div>
									<div class="text-xs text-muted-foreground">{m.bridge_running_device()}</div>
								</div>
								<div class="ml-auto h-2 w-2 rounded-full bg-green-400"></div>
							</div>
						</div>

						<div class="mt-4 grid grid-cols-2 gap-2">
							{#each bridgeCaps as cap}
								<div
									class="rounded-md border border-border bg-muted px-3 py-2 text-center text-xs text-muted-foreground"
								>
									{cap}
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- ===================================================
	     APPS
	     =================================================== -->
	<section class="bg-background px-6 py-24">
		<div class="mx-auto max-w-7xl">
			<div class="mb-16 max-w-xl">
				<p class="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
					{m.applications_label()}
				</p>
				<h2 class="text-4xl font-black tracking-tight text-foreground">
					{m.apps_title()}
				</h2>
				<p class="mt-4 text-muted-foreground">
					{m.apps_desc()}
				</p>
			</div>

			<div class="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-6">
				{#each apps as app}
					<div
						class="group flex cursor-default flex-col items-center gap-2.5 rounded-xl border border-border p-4 transition-shadow hover:shadow-sm"
					>
						<div
							class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm"
						>
							{app.label.length <= 2 ? app.label : app.label[0]}
						</div>
						<span class="text-xs font-medium text-muted-foreground">{app.name}</span>
					</div>
				{/each}
			</div>

			<p class="mt-6 text-sm text-muted-foreground">
				{m.apps_roadmap()}
			</p>
		</div>
	</section>

	<!-- ===================================================
	     ARCHITECTURE
	     =================================================== -->
	<section class="border-y border-border bg-muted/50 px-6 py-24">
		<div class="mx-auto max-w-7xl">
			<div class="grid grid-cols-1 items-start gap-16 lg:grid-cols-2">
				<div>
					<p class="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
						{m.arch_label()}
					</p>
					<h2 class="text-4xl font-black leading-tight tracking-tight text-foreground">
						{m.arch_title()}
					</h2>
					<p class="mt-5 text-lg leading-relaxed text-muted-foreground">
						{m.arch_desc()}
					</p>

					<!-- Developer snippet -->
					<div class="mt-8 overflow-hidden rounded-xl border border-border bg-gray-900">
						<div class="border-b border-gray-700 px-5 py-3">
							<div class="flex items-center gap-2 text-xs text-gray-500">
								<Code2 class="h-3.5 w-3.5" />
								my-app/index.ts
							</div>
						</div>
						<div class="p-5 font-mono text-xs leading-relaxed">
							<div>
								<span class="text-purple-400">import</span>
								<span class="text-white"> {'{'} </span>
								<span class="text-blue-300">App, ipc, fs</span>
								<span class="text-white"> {'}'} </span>
								<span class="text-purple-400">from</span>
								<span class="text-green-400"> 'rizinos-sdk'</span>
							</div>
							<div class="mt-3 text-gray-500">{'// declare capabilities at install time'}</div>
							<div>
								<span class="text-purple-400">export const</span>
								<span class="text-yellow-300"> manifest</span>
								<span class="text-white"> = {'{'}</span>
							</div>
							<div class="pl-5">
								<span class="text-blue-300">permissions</span><span class="text-white">: [</span><span
									class="text-green-400">'fs:read'</span
								><span class="text-white">, </span><span class="text-green-400">'network'</span><span
									class="text-white">]</span
								>
							</div>
							<div><span class="text-white">{'}'}</span></div>
							<div class="mt-3 text-gray-500">{'// runs as an isolated WASM process'}</div>
							<div>
								<span class="text-purple-400">export default</span>
								<span class="text-purple-400"> new</span>
								<span class="text-yellow-300"> App</span><span class="text-white">({'{'}</span>
							</div>
							<div class="pl-5">
								<span class="text-blue-300">onMount</span><span class="text-white">: </span><span
									class="text-purple-400">async</span
								>
								<span class="text-white">(ctx) => </span><span class="text-white">{'{'}</span>
							</div>
							<div class="pl-10">
								<span class="text-purple-400">const</span>
								<span class="text-white"> files = </span><span class="text-purple-400">await </span
								><span class="text-blue-300">fs</span><span class="text-white">.</span><span
									class="text-yellow-300">readdir</span
								><span class="text-white">('~/Documents')</span>
							</div>
							<div class="pl-5"><span class="text-white">{'}'}</span></div>
							<div><span class="text-white">{'}'})</span></div>
						</div>
					</div>
				</div>

				<!-- Layer stack -->
				<div class="flex flex-col gap-2">
					{#each layers as layer, i}
						<div
							class="rounded-lg border border-border bg-card px-5 py-4 shadow-sm transition-shadow hover:shadow-md"
						>
							<div class="flex items-center justify-between">
								<span class="text-sm font-semibold text-foreground">{layer.label}</span>
								<span class="text-xs text-muted-foreground">Layer {layers.length - i}</span>
							</div>
							<div class="mt-1 text-xs text-muted-foreground">{layer.sub}</div>
						</div>
					{/each}
					<p class="mt-3 text-xs text-muted-foreground">
						{m.arch_ipc_note()}
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- ===================================================
	     CTA
	     =================================================== -->
	<section class="bg-background px-6 py-28">
		<div class="mx-auto max-w-2xl text-center">
			<h2 class="text-4xl font-black tracking-tight text-foreground lg:text-5xl">
				{m.cta_title()}
			</h2>
			<p class="mt-5 text-lg text-muted-foreground">
				{m.cta_desc()}
			</p>
			<div class="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
				<a
					href="/signup"
					class="group inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
				>
					{m.cta_button()}
					<ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
				</a>
			</div>
			<p class="mt-4 text-sm text-muted-foreground">
				{m.cta_note()}
			</p>
		</div>
	</section>
</div>
