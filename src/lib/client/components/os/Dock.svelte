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
	} from 'lucide-svelte';
	import DockField from '$ui/os/DockField.svelte';
	import { focusProcess, launchApp } from '$lib/client/index.svelte';
	import ThemeController from '$ui/os/ThemeController.svelte';
	import { Spring } from 'svelte/motion';


	const iconSize = 18;
	// TODO: Different layouts for os.isMobile

	let taskbar: TaskbarItem[] = $derived([...new Set([...os.taskbar, ...os.processList.map(process => process.appId).filter(appId => !os.taskbar.includes(appId))])].map(appId => {
		const processes = os.processList.filter(process => process.appId === appId && !process.isHidden).map(process => process.id);
		return {
			appId,
			isPinned: true,
			isFocused: processes.find(id => id === os.focusedProcessId) !== undefined,
			hasWindows: processes.length
		};
	}));

	function taskbarAppClick(item: TaskbarItem, e: MouseEvent) {
		e.stopPropagation();
		if (item.hasWindows) {
			const processList = os.processList.filter(process => process.appId === item.appId && !process.isHidden);
			if (processList.find(process => process.id === os.focusedProcessId)) {
				os.focusedProcessId = null;
				processList.forEach(process => process.isMinimized = true);
			} else {
				processList.forEach(process => focusProcess(process));
			}
		} else launchApp(item.appId);
	}

	function taskbarAppPointerDown(item: TaskbarItem, e: PointerEvent) {
		os.processList.forEach(process => {
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
</script>

<div class="flex justify-between h-10 bg-base-100 w-full z-[100000] overflow-hidden"
		 oncontextmenu={e => showContextMenu(e, [])}
		 onpointerdown={() => os.focusedProcessId = null}
		 ondrop={e => {
			 	const data = e.dataTransfer?.getData('file');
				if (!data) return;
				//if(data.toLowerCase().endsWith(".link"))
		 }}
		 role="menu"
		 tabindex="0"
>
	<div class="flex">
		<DockField innerClasses="group-hover:bg-base-300" onclick={() => os.isAppLauncherOpen = true}
							 title="Start Menu">
			<div class="avatar placeholder aspect-square" onclick={handleClick} role="none" style="transform: scale({scale})">
				<div class="bg-base-content text-base-200 w-8 rounded-full">
					<span class="text-xs">{os.username}</span>
				</div>
			</div>
		</DockField>
		{#each taskbar as item (item.appId)}
			<DockField title={item.appId}
								 innerClasses="aspect-square {item.hasWindows ? 'bg-base-content ' + (item.isFocused ? 'bg-opacity-40 group-hover:bg-opacity-50' : 'bg-opacity-20 group-hover:bg-opacity-30') : 'group-hover:bg-base-300'}"
								 onpointerdown={e => item.hasWindows && taskbarAppPointerDown(item, e)}
								 onclick={e => taskbarAppClick(item, e)}>
				<img alt={item.appId} draggable="false" src="assets/img/ico/{item.appId}.ico">
			</DockField>
		{/each}
	</div>
	<div class="flex">
		<!-- Theme Controller -->
		<DockField innerClasses="group-hover:bg-base-300">
			<ThemeController />
		</DockField>
		<!-- Volume Control -->
		<DockField innerClasses="group-hover:bg-base-300">
			{#if os.volume === 0}
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
		<DockField innerClasses="group-hover:bg-base-300" onclick={() => {}}>
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
		<DockField innerClasses="w-[72px] group-hover:bg-base-300">
			<Clock />
		</DockField>
		<!-- Show Desktop -->
		<button aria-label="Show Desktop"
						class="w-2 border-l border-base-300"
						onclick={() => os.processList.forEach(process => process.isMinimized = true)}>
		</button>
	</div>
</div>
