<script lang="ts">
	import os from '$lib/os.svelte.js';
	import Clock from '$ui/os/Clock.svelte';
	import { showContextMenu } from '$lib/client/menu';
	import { type TaskbarItem } from '$types';
	import {
		Battery,
		BatteryCharging,
		BatteryFull,
		BatteryLow,
		BatteryMedium,
		Volume,
		Volume1,
		Volume2,
		VolumeX
	} from '@lucide/svelte';
	import DockField from '$ui/os/DockField.svelte';
	import { focusProcess, launchApp } from '$lib/client/index.svelte';
	import ThemeController from '$ui/os/ThemeController.svelte';
	import Overlay from '$ui/os/Overlay.svelte';
	import { Spring } from 'svelte/motion';
	import * as Avatar from '$shadcn/avatar';
	import { format } from 'date-fns';
	import { SvelteDate } from 'svelte/reactivity';

	const iconSize = 18;
	// TODO: Different layouts for os.isMobile

	let taskbar: TaskbarItem[] = $derived(
		[
			...new Set([
				...os.taskbar,
				...os.processList
					.map((process) => process.appId)
					.filter((appId) => !os.taskbar.includes(appId))
			])
		].map((appId) => {
			const processes = os.processList
				.filter((process) => process.appId === appId && !process.isHidden)
				.map((process) => process.id);
			return {
				appId,
				isPinned: true,
				isFocused: processes.find((id) => id === os.focusedProcessId) !== undefined,
				hasWindows: processes.length
			};
		})
	);

	function taskbarAppClick(item: TaskbarItem, e: MouseEvent) {
		e.stopPropagation();
		if (item.hasWindows) {
			const processList = os.processList.filter(
				(process) => process.appId === item.appId && !process.isHidden
			);
			if (processList.find((process) => process.id === os.focusedProcessId)) {
				os.focusedProcessId = null;
				processList.forEach((process) => (process.isMinimized = true));
			} else {
				processList.forEach((process) => focusProcess(process));
			}
		} else launchApp(item.appId);
	}

	function taskbarAppPointerDown(item: TaskbarItem, e: PointerEvent) {
		os.processList.forEach((process) => {
			if (process.appId === item.appId && process.id === os.focusedProcessId) {
				e.stopPropagation();
			}
		});
	}

	const scale = new Spring(1, {
		stiffness: 0.2,
		damping: 0.4
	});

	function handleClick() {
		scale.set(0.75);
		setTimeout(() => scale.set(1), 1000);
	}

	let isVolumeOpen = $state(false);
	let isClockOpen = $state(false);

	const now = new SvelteDate();
	$effect(() => {
		const timer = setInterval(() => now.setTime(Date.now()), 1000);
		return () => clearInterval(timer);
	});
</script>

<div
	class="bg-background z-[100000] flex h-10 w-full justify-between overflow-hidden"
	oncontextmenu={(e) => showContextMenu(e, [])}
	onpointerdown={() => (os.focusedProcessId = null)}
	ondrop={(e) => {
		const data = e.dataTransfer?.getData('file');
		if (!data) return;
		//if(data.toLowerCase().endsWith(".link"))
	}}
	role="menu"
	tabindex="0"
>
	<div class="flex">
		<DockField
			innerClasses="group-hover:bg-muted"
			onclick={() => (os.isAppLauncherOpen = true)}
			title="Start Menu"
		>
			<Avatar.Root onclick={handleClick} role="none" style="transform: scale({scale})">
				<Avatar.Fallback>{os.username?.slice(0, 2).toUpperCase()}</Avatar.Fallback>
			</Avatar.Root>
		</DockField>
		{#each taskbar as item (item.appId)}
			<DockField
				title={item.appId}
				innerClasses="aspect-square {item.hasWindows
					? 'bg-foreground ' +
						(item.isFocused
							? 'bg-opacity-40 group-hover:bg-opacity-50'
							: 'bg-opacity-20 group-hover:bg-opacity-30')
					: 'group-hover:bg-muted'}"
				onpointerdown={(e: PointerEvent) => item.hasWindows && taskbarAppPointerDown(item, e)}
				onclick={(e: MouseEvent) => taskbarAppClick(item, e)}
			>
				<img alt={item.appId} draggable="false" src="assets/img/ico/{item.appId}.ico" />
			</DockField>
		{/each}
	</div>
	<div class="flex">
		<!-- Theme Controller -->
		<DockField innerClasses="group-hover:bg-muted">
			<ThemeController />
		</DockField>
		<!-- Volume Control -->
		<DockField innerClasses="group-hover:bg-muted" onclick={() => (isVolumeOpen = !isVolumeOpen)}>
			{#if os.isMuted || os.volume === 0}
				<VolumeX size={iconSize} />
			{:else if os.volume > 66}
				<Volume2 size={iconSize} />
			{:else if os.volume > 33}
				<Volume1 size={iconSize} />
			{:else}
				<Volume size={iconSize} />
			{/if}
		</DockField>
		<!-- Battery -->
		<DockField innerClasses="group-hover:bg-muted">
			{#if os.battery.isCharging}
				<BatteryCharging size={iconSize} />
			{:else if os.battery.level > 75}
				<BatteryFull size={iconSize} />
			{:else if os.battery.level > 50}
				<BatteryMedium size={iconSize} />
			{:else if os.battery.level > 25}
				<BatteryLow size={iconSize} />
			{:else}
				<Battery size={iconSize} />
			{/if}
		</DockField>
		<!-- Clock -->
		<DockField innerClasses="w-[72px] group-hover:bg-muted" onclick={() => (isClockOpen = !isClockOpen)}>
			<Clock />
		</DockField>
		<!-- Show Desktop -->
		<button
			aria-label="Show Desktop"
			class="border-border w-2 border-l"
			onclick={() => os.processList.forEach((process) => (process.isMinimized = true))}
		>
		</button>
	</div>
</div>

{#if isVolumeOpen}
	<Overlay onclose={() => (isVolumeOpen = false)}>
		<div class="bg-card border-border fixed right-28 bottom-12 flex w-48 flex-col gap-3 rounded-lg border p-4 shadow-lg">
			<div class="flex items-center justify-between text-sm font-medium">
				<span>Volume</span>
				<span>{os.isMuted ? 'Muted' : `${os.volume}%`}</span>
			</div>
			<input
				type="range"
				min="0"
				max="100"
				bind:value={os.volume}
				onpointerdown={(e) => e.stopPropagation()}
				class="w-full accent-primary"
			/>
			<button
				class="hover:bg-muted flex items-center gap-2 rounded px-2 py-1 text-sm"
				onclick={(e) => { e.stopPropagation(); os.isMuted = !os.isMuted; }}
			>
				{#if os.isMuted}
					<Volume size={14} />
					Unmute
				{:else}
					<VolumeX size={14} />
					Mute
				{/if}
			</button>
		</div>
	</Overlay>
{/if}

{#if isClockOpen}
	<Overlay onclose={() => (isClockOpen = false)}>
		<div class="bg-card border-border fixed right-2 bottom-12 flex w-52 flex-col items-center gap-1 rounded-lg border p-4 shadow-lg">
			<div class="text-3xl font-light tabular-nums">{format(now.getTime(), 'HH:mm')}</div>
			<div class="text-muted-foreground text-sm">{format(now.getTime(), 'ss')}s</div>
			<div class="mt-1 text-sm font-medium">{format(now.getTime(), 'EEEE, d. MMMM yyyy')}</div>
		</div>
	</Overlay>
{/if}
