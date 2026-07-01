<script lang="ts">
	import { onMount } from 'svelte';
	import { Download, X } from '@lucide/svelte';
	import pwa from '$lib/client/pwa.svelte';
	import * as Alert from '$shadcn/alert';

	const STORAGE_KEY = 'pwa-install-dismissed';

	let show = $state(false);
	let installing = $state(false);

	onMount(() => {
		const isStandalone =
			window.matchMedia('(display-mode: standalone)').matches ||
			(navigator as Navigator & { standalone?: boolean }).standalone === true;
		pwa.isStandalone = isStandalone;

		if (isStandalone) return;

		const dismissed = localStorage.getItem(STORAGE_KEY) === 'true';

		function onBeforeInstall(e: Event) {
			e.preventDefault();
			pwa.deferredPrompt = e as typeof pwa.deferredPrompt;
			if (!dismissed) show = true;
		}

		function onAppInstalled() {
			show = false;
			pwa.deferredPrompt = null;
			pwa.isStandalone = true;
		}

		window.addEventListener('beforeinstallprompt', onBeforeInstall);
		window.addEventListener('appinstalled', onAppInstalled);

		return () => {
			window.removeEventListener('beforeinstallprompt', onBeforeInstall);
			window.removeEventListener('appinstalled', onAppInstalled);
		};
	});

	function dismiss() {
		show = false;
		localStorage.setItem(STORAGE_KEY, 'true');
	}

	async function install() {
		if (!pwa.deferredPrompt) return;
		installing = true;
		try {
			pwa.deferredPrompt.prompt();
			const { outcome } = await pwa.deferredPrompt.userChoice;
			if (outcome === 'accepted') {
				pwa.isStandalone = true;
				show = false;
			}
		} finally {
			pwa.deferredPrompt = null;
			installing = false;
		}
	}
</script>

{#if show}
	<div class="fixed top-2 right-2 z-[2147483635] w-64 rounded-lg border bg-card text-card-foreground shadow-lg">
		<div class="p-3">
			<div class="flex items-start gap-3">
				<img src="/favicon.png" alt="RizinOS" class="size-12 shrink-0 rounded-xl" />
				<div class="min-w-0 flex-1">
					<div class="flex items-center justify-between gap-2">
						<p class="text-sm font-medium leading-none">RizinOS installieren</p>
						<button
							onclick={dismiss}
							class="text-muted-foreground hover:text-foreground -mr-0.5 shrink-0 transition-colors"
							aria-label="Schließen"
						>
							<X class="h-3.5 w-3.5" />
						</button>
					</div>
					<p class="text-muted-foreground mt-1 text-xs">Als App installieren für die beste Erfahrung.</p>
				</div>
			</div>
			<button
				onclick={install}
				disabled={installing}
				class="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
			>
				<Download class="size-3.5" />
				{installing ? 'Installieren...' : 'Installieren'}
			</button>
		</div>
	</div>
{/if}
