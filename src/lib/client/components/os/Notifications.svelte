<script lang="ts">
	import os from '$lib/os.svelte';
	import { CircleAlert, CircleCheck, Info, OctagonX } from 'lucide-svelte';
	import type { Notification } from '$types';
	import { fly } from 'svelte/transition';
	// TODO: Transition doesn't work yet

	const showSeconds = 5;
	const icons = {
		'info': Info,
		'success': CircleCheck,
		'warning': CircleAlert,
		'error': OctagonX
	};

	const filter = (notification: Notification) => notification.createdAt.getTime() > (new Date().getTime() - showSeconds * 1000);

	$effect(() => {
		setTimeout(() => {
			os.notifications = os.notifications.filter(filter);
		}, showSeconds * 1000);
	});

	const freshNotifications = $derived(os.notifications.filter(filter));
</script>

{#if os.notifications.length > 0}
	<div class="toast right-0 z-[2147483634] {os.isMobile ? 'w-full top-0' : 'w-72 bottom-10'}">
		{#if os.notifications.length > 4}
			<div>
				{os.notifications.length - 4} ...
			</div>
		{/if}
		{#each freshNotifications as notification (notification)}
			{@const Icon = icons[notification.type]}
			<div
				class="alert {os.isMobile ? 'w-full' : 'border border-gray-300'}"
				onclick={notification.actions[0].action}
				role="none"
				transition:fly
			>
				<Icon />
				<span>{notification}</span>
				<div>
					{#each notification.actions as { title, action } (title)}
						<button onclick={e => {e.stopPropagation();action();}}>{title}</button>
					{/each}
				</div>
			</div>
		{/each}
	</div>
{/if}
