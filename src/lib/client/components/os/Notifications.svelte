<script lang="ts">
	import os from '$lib/os.svelte';
	import { CircleAlert, CircleCheck, Info, OctagonX } from '@lucide/svelte';
	import type { Notification } from '$types';
	import { fly } from 'svelte/transition';
	import * as Alert from '$shadcn/alert';

	const showSeconds = 5;
	const icons = {
		info: Info,
		success: CircleCheck,
		warning: CircleAlert,
		error: OctagonX
	};

	const filter = (notification: Notification) =>
		notification.createdAt.getTime() > new Date().getTime() - showSeconds * 1000;

	$effect(() => {
		const interval = setInterval(() => {
			os.notifications = os.notifications.filter(filter);
		}, 1000);
		return () => clearInterval(interval);
	});

	const freshNotifications = $derived(os.notifications.filter(filter));
</script>

{#if os.notifications.length > 0}
	<div
		class="fixed right-0 z-[2147483634] flex flex-col gap-2 p-4 {os.isMobile
			? 'top-0 w-full'
			: 'bottom-10 w-72'}"
	>
		{#if os.notifications.length > 4}
			<div>
				{os.notifications.length - 4} ...
			</div>
		{/if}
		{#each freshNotifications as notification (notification)}
			{@const Icon = icons[notification.type]}
			<div transition:fly>
				<Alert.Root
					variant={notification.type === 'error' ? 'destructive' : 'default'}
					class="cursor-pointer {os.isMobile ? 'w-full' : ''}"
					onclick={() => notification.actions[0]?.action()}
					role="none"
				>
					<Icon />
					<Alert.Description>{notification.title}</Alert.Description>
					<div class="flex gap-1">
						{#each notification.actions as { title, action } (title)}
							<button
								onclick={(e) => {
									e.stopPropagation();
									action();
								}}
								class="text-xs underline">{title}</button
							>
						{/each}
					</div>
				</Alert.Root>
			</div>
		{/each}
	</div>
{/if}
