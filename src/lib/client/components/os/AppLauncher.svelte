<script lang="ts">
	import Overlay from '$ui/os/Overlay.svelte';
	import { addNotification, launchApp } from '$lib/client/index.svelte';
	import os from '$lib/os.svelte';
	import { LogOut, Settings, SquareActivity, Users } from '@lucide/svelte';
	import { slide } from 'svelte/transition';
	import { NotificationType } from '$types';

	const logout = () => {
		if (!confirm('Do you really want to logout?')) return;
		fetch('/api/auth/logout')
			.then(async (res) => {
				if ((await res.json()) === true) location.reload();
				else throw new Error();
			})
			.catch(() => {
				addNotification('Failed to logout', 'Please try again later', NotificationType.ERROR, [
					{
						title: 'Retry',
						action: logout
					}
				]);
			});
	};
</script>

{#if os.isAppLauncherOpen}
	<Overlay onclose={() => (os.isAppLauncherOpen = !os.isAppLauncherOpen)}>
		<div
			transition:slide
			class="fixed flex flex-col {os.isMobile
				? 'h-svh w-svh'
				: 'bottom-10'} bg-muted w-52 cursor-pointer text-lg"
		>
			<button
				class="hover:bg-muted/80 flex h-10 w-full items-center gap-4 p-3"
				onclick={() => launchApp('taskmgr')}
			>
				<SquareActivity />
				Task Manager
			</button>
			<button
				class="hover:bg-muted/80 flex h-10 w-full items-center gap-4 p-3"
				onclick={() => launchApp('settings')}
			>
				<Settings />
				Settings
			</button>
			<button class="hover:bg-muted/80 flex h-10 w-full items-center gap-4 p-3" onclick={() => {}}>
				<Users />
				Change User
			</button>
			<button class="hover:bg-muted/80 flex h-10 w-full items-center gap-4 p-3" onclick={logout}>
				<LogOut />
				Logout
			</button>
		</div>
	</Overlay>
{/if}
