<script lang="ts">
	import { enhance } from '$app/forms';
	import { Edit2, Check, X } from '@lucide/svelte';
	import * as Button from '$shadcn/button';
	import * as Input from '$shadcn/input';

	interface Props {
		value: string | number;
		label: string;
		action: string;
		fieldName?: string;
		hiddenFields?: Record<string, string>;
		type?: 'text' | 'number' | 'select';
		selectOptions?: Array<{ value: string; label: string }>;
		onEditStart?: () => void;
		onEditEnd?: () => void;
		children?: any;
	}

	let {
		value,
		label,
		action,
		fieldName = 'value',
		hiddenFields = {},
		type = 'text',
		selectOptions = [],
		onEditStart = () => {},
		onEditEnd = () => {},
		children
	}: Props = $props();

	let isEditing = $state(false);
	let inputValue = $state(String(value));

	function toggleEdit() {
		isEditing = !isEditing;
		if (isEditing) {
			onEditStart();
		} else {
			onEditEnd();
		}
	}

	function handleSubmit() {
		toggleEdit();
	}
</script>

<div>
	<p class="text-xs font-medium text-muted-foreground uppercase mb-2">{label}</p>
	{#if !isEditing}
		<div class="flex items-center justify-between">
			{#if children}
				{@render children()}
			{:else}
				<p class="text-sm capitalize">{value || '-'}</p>
			{/if}
			<Button.Root type="button" variant="ghost" size="sm" onclick={toggleEdit}>
				<Edit2 size={14} />
			</Button.Root>
		</div>
	{:else}
		<form method="POST" {action} use:enhance class="flex gap-2" onsubmit={handleSubmit}>
			{#each Object.entries(hiddenFields) as [name, val]}
				<input type="hidden" {name} value={val} />
			{/each}

			{#if type === 'select'}
				<select
					name={fieldName}
					bind:value={inputValue}
					class="flex-1 px-2 py-1 border rounded-md bg-background text-sm"
				>
					<option value="">Select...</option>
					{#each selectOptions as opt}
						<option value={opt.value} selected={opt.value === String(value)}>
							{opt.label}
						</option>
					{/each}
				</select>
			{:else}
				<Input.Root
					name={fieldName}
					{type}
					bind:value={inputValue}
					required
					class="text-sm"
				/>
			{/if}

			<Button.Root type="submit" variant="ghost" size="sm">
				<Check size={14} />
			</Button.Root>
			<Button.Root type="button" variant="ghost" size="sm" onclick={toggleEdit}>
				<X size={14} />
			</Button.Root>
		</form>
	{/if}
</div>
