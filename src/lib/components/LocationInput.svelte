<script lang="ts">
	import { enhance } from '$app/forms';
	import { Check, X } from '@lucide/svelte';
	import * as Button from '$shadcn/button';
	import * as Input from '$shadcn/input';

	interface Props {
		location: string | null;
		label?: string;
		action: string;
		hiddenFields?: Record<string, string>;
		displayOnly?: boolean;
		onEditStart?: () => void;
		onEditEnd?: () => void;
	}

	let {
		location,
		label = 'Location',
		action,
		hiddenFields = {},
		displayOnly = false,
		onEditStart = () => {},
		onEditEnd = () => {}
	}: Props = $props();

	let isEditing = $state(false);
	let x = $state(0);
	let y = $state(0);
	let z = $state(0);

	let yaw = $state(0);
	let pitch = $state(0);

	function parseLocation(loc: string | null) {
		if (!loc) return { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 };
		const matches = loc.match(/x:([-\d.]+)\s+y:([-\d.]+)\s+z:([-\d.]+)(?:\s+yaw:([-\d.]+))?(?:\s+pitch:([-\d.]+))?/i);
		if (matches) {
			return {
				x: parseFloat(matches[1]),
				y: parseFloat(matches[2]),
				z: parseFloat(matches[3]),
				yaw: matches[4] ? parseFloat(matches[4]) : 0,
				pitch: matches[5] ? parseFloat(matches[5]) : 0
			};
		}
		return { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 };
	}

	function formatLocation(xVal: number, yVal: number, zVal: number, yawVal: number, pitchVal: number) {
		return `x:${xVal} y:${yVal} z:${zVal} yaw:${yawVal} pitch:${pitchVal}`;
	}

	function toggleEdit() {
		if (!isEditing) {
			const parsed = parseLocation(location);
			x = parsed.x;
			y = parsed.y;
			z = parsed.z;
			yaw = parsed.yaw;
			pitch = parsed.pitch;
			onEditStart();
		} else {
			onEditEnd();
		}
		isEditing = !isEditing;
	}

	function handleSubmit() {
		toggleEdit();
	}
</script>

<div class="mb-2">
	<p class="text-xs font-medium text-muted-foreground uppercase mb-2">{label}</p>
	{#if !isEditing}
		<div class="flex items-center justify-between">
			<p class="text-sm font-mono">{location || '-'}</p>
			{#if !displayOnly}
				<Button.Root type="button" variant="ghost" size="sm" onclick={toggleEdit}>
					<!-- Edit icon from lucide -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
					</svg>
				</Button.Root>
			{/if}
		</div>
	{:else}
		<form method="POST" {action} use:enhance class="space-y-2" onsubmit={handleSubmit}>
			{#each Object.entries(hiddenFields) as [name, val]}
				<input type="hidden" {name} value={val} />
			{/each}

			<div class="grid grid-cols-2 gap-2 md:grid-cols-5">
				<div>
					<label class="text-xs text-muted-foreground">X</label>
					<Input.Root name="x" type="number" bind:value={x} step="0.1" required />
				</div>
				<div>
					<label class="text-xs text-muted-foreground">Y</label>
					<Input.Root name="y" type="number" bind:value={y} step="0.1" required />
				</div>
				<div>
					<label class="text-xs text-muted-foreground">Z</label>
					<Input.Root name="z" type="number" bind:value={z} step="0.1" required />
				</div>
				<div>
					<label class="text-xs text-muted-foreground">Yaw</label>
					<Input.Root name="yaw" type="number" bind:value={yaw} step="1" />
				</div>
				<div>
					<label class="text-xs text-muted-foreground">Pitch</label>
					<Input.Root name="pitch" type="number" bind:value={pitch} step="1" />
				</div>
			</div>

			<input
				type="hidden"
				name="location"
				value={formatLocation(x, y, z, yaw, pitch)}
			/>

			<div class="flex gap-2 pt-2">
				<Button.Root type="submit" variant="ghost" size="sm">
					<Check size={14} />
				</Button.Root>
				<Button.Root type="button" variant="ghost" size="sm" onclick={toggleEdit}>
					<X size={14} />
				</Button.Root>
			</div>
		</form>
	{/if}
</div>
