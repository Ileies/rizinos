<script lang="ts">
	import Overlay from '$ui/os/Overlay.svelte';
	import { addNotification, launchApp } from '$lib/client/index.svelte';
	import os from '$lib/os.svelte';
	import { LogOut, Settings, SquareActivity, Users } from 'lucide-svelte';
	import { slide } from 'svelte/transition';
	import { NotificationType } from '$types';

	const logout = () => {
		if (!confirm('Do you really want to logout?')) return;
		fetch('/api/os/logout').then(async res => {
			if (await res.json() === true) location.reload();
			else throw new Error();
		}).catch(() => {
			addNotification('Failed to logout', 'Please try again later', NotificationType.ERROR, [{
				title: 'Retry',
				action: logout
			}]);
		});
	};

	addNotification('Failed to logout', 'Please try again later', NotificationType.ERROR, [{
		title: 'Retry',
		action: logout
	}]);
</script>

{#if (os.isAppLauncherOpen)}
	<Overlay onclose={() => os.isAppLauncherOpen = !os.isAppLauncherOpen}>
		<div transition:slide
				 class="menu fixed {os.isMobile ? 'w-svh h-svh' : 'bottom-10'} bg-base-200 text-lg w-52 cursor-pointer">
			<button class="" onclick={() => launchApp('taskmgr')}>
				<SquareActivity />
				Task Manager
			</button>
			<button class="flex w-full items-center gap-4 h-10 p-3 hover:bg-base-300" onclick={() => launchApp('settings')}>
				<Settings />
				Settings
			</button>
			<button class="flex w-full items-center gap-4 h-10 p-3 hover:bg-base-300" onclick={() => {}}>
				<Users />
				Change User
			</button>
			<button class="flex w-full items-center gap-4 h-10 p-3 hover:bg-base-300" onclick={logout}>
				<LogOut />
				Logout
			</button>
		</div>
	</Overlay>
{/if}