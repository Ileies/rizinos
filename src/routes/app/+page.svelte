<script lang="ts">
	import Notifications from '$ui/os/Notifications.svelte';
	import Dock from '$ui/os/Dock.svelte';
	import Desktop from '$ui/os/Desktop.svelte';
	import ContextMenu from '$ui/os/ContextMenu.svelte';
	import AppLauncher from '$ui/os/AppLauncher.svelte';
	import os from '$lib/os.svelte';
	import { browser } from '$app/environment';
	import { Theme } from '$types';

	if (browser) {
		window.addEventListener('resize', () => {
			const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;
			const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
			os.isMobile = isSmallScreen && hasTouchSupport;
			os.screenSize = {
				width: window.innerWidth,
				height: window.innerHeight
			};
		});
		window.dispatchEvent(new Event('resize'));

		if ('getBattery' in navigator) {
			navigator.getBattery().then(battery => {
				battery.addEventListener('levelchange', () => {
					os.battery.level = battery.level;
				});
				battery.addEventListener('chargingchange', () => {
					os.battery.isCharging = battery.charging;
				});
				battery.addEventListener('chargingtimechange', () => {
					os.battery.chargingTime = battery.chargingTime;
				});
				battery.addEventListener('dischargingtimechange', () => {
					os.battery.dischargingTime = battery.dischargingTime;
				});
				os.battery = {
					level: battery.level,
					isCharging: battery.charging,
					chargingTime: battery.chargingTime,
					dischargingTime: battery.dischargingTime
				};
			});
		}

		const localTheme = localStorage.getItem('theme') as Theme;
		os.theme = Object.values(Theme).includes(localTheme) ? localTheme : window.matchMedia('(prefers-color-scheme: dark)').matches ? Theme.Dark : Theme.Light;

		window.addEventListener('message', e => {
			// TODO: Think through if apps should contact the OS directly using onmessage or via WebSocket

			// Only handle messages from our own domain
			if (e.origin !== window.location.origin) return;

			const message = e.data as AppMessage;
			if (!message || typeof message.type !== 'string') return;

			// Handle different message types
			switch (message.type) {
				case 'app:ready':
					// App has finished loading
					console.log('App ready:', message.data);
					break;
				case 'app:error':
					// App encountered an error
					console.error('App error:', message.data);
					break;
				case 'app:request':
					// App is requesting something from the OS
					console.log('App request:', message.data);
					break;
				default:
					console.log('Unknown message type:', message.type, message.data);
			}
		});
	}

	const { data } = $props();
	os.username = data.username;
</script>

<div
	class="flex flex-col w-svh h-svh bg-accent bg-cover bg-center bg-no-repeat overflow-hidden select-none cursor-default"
	style:background-image={os.wallpaperUrl ? `url("/storage/${os.wallpaperUrl}?t=${Date.now()}")` : 'none'}
>
	<Desktop />
	<Dock />
	<Notifications />
	<AppLauncher />
	<ContextMenu />
</div>
