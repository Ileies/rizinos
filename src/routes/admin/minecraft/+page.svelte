<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionResult } from '@sveltejs/kit';
	import { Plus, Pencil, Trash2, CheckCircle2, XCircle, Loader2 } from '@lucide/svelte';
	import * as Table from '$shadcn/table';
	import * as Button from '$shadcn/button';
	import * as Input from '$shadcn/input';
	import Modal from '$lib/components/Modal.svelte';
	import RestrictEditor from '$lib/components/RestrictEditor.svelte';
	import LocationEditor from '$lib/components/LocationEditor.svelte';
	import { Pickaxe, Wand2, Compass, Eye } from '@lucide/svelte';

	let { data } = $props();

	let currentTab = $state('players');
	let worldNames = $derived(data.worlds.map((w) => w.name));

	// --- Create Player validation ---
	type VState = 'idle' | 'loading' | 'valid' | 'invalid';
	let cpName = $state('');
	let cpUuid = $state('');
	let cpNameState = $state<VState>('idle');
	let cpUuidState = $state<VState>('idle');
	let cpValidateError = $state('');

	$effect(() => {
		if (!createPlayerOpen) {
			cpName = ''; cpUuid = '';
			cpNameState = 'idle'; cpUuidState = 'idle'; cpValidateError = '';
		}
	});

	async function cpLookupByName(name: string) {
		name = name.trim();
		if (!name) return;
		cpNameState = 'loading'; cpUuidState = 'idle'; cpValidateError = '';
		try {
			const res = await fetch(`/admin/minecraft/validate?type=username&value=${encodeURIComponent(name)}`);
			const body = await res.json();
			if (res.ok) {
				cpName = body.name;
				cpUuid = body.uuid;
				cpNameState = 'valid'; cpUuidState = 'valid';
			} else {
				cpNameState = 'invalid';
				cpValidateError = body.error ?? 'Player not found';
			}
		} catch {
			cpNameState = 'invalid';
			cpValidateError = 'Network error';
		}
	}

	async function cpLookupByUuid(uuid: string) {
		uuid = uuid.trim();
		if (!uuid) return;
		cpUuidState = 'loading'; cpNameState = 'idle'; cpValidateError = '';
		try {
			const res = await fetch(`/admin/minecraft/validate?type=uuid&value=${encodeURIComponent(uuid)}`);
			const body = await res.json();
			if (res.ok) {
				cpName = body.name;
				cpUuid = body.uuid;
				cpUuidState = 'valid'; cpNameState = 'valid';
			} else {
				cpUuidState = 'invalid';
				cpValidateError = body.error ?? 'Player not found';
			}
		} catch {
			cpUuidState = 'invalid';
			cpValidateError = 'Network error';
		}
	}

	function cpHandleNamePaste(e: ClipboardEvent) {
		const text = e.clipboardData?.getData('text') ?? '';
		const trimmed = text.trim();
		if (trimmed) { e.preventDefault(); cpName = trimmed; cpLookupByName(trimmed); }
	}

	function cpHandleUuidPaste(e: ClipboardEvent) {
		const text = e.clipboardData?.getData('text') ?? '';
		const trimmed = text.trim();
		if (trimmed) { e.preventDefault(); cpUuid = trimmed; cpLookupByUuid(trimmed); }
	}

	function cpHandleNameBlur() {
		if (cpNameState === 'idle' && cpName.trim()) cpLookupByName(cpName);
	}

	function cpHandleUuidBlur() {
		if (cpUuidState === 'idle' && cpUuid.trim()) cpLookupByUuid(cpUuid);
	}

	// --- Players ---
	let editingPlayerUuid = $state<string | null>(null);
	let playerModalOpen = $state(false);
	let createPlayerOpen = $state(false);
	let editingPlayer = $derived(data.mcUsers.find((u) => u.uuid === editingPlayerUuid) ?? null);
	let permItems = $state<string[]>([]);

	function openPlayerEdit(uuid: string) {
		const player = data.mcUsers.find((u) => u.uuid === uuid);
		permItems = [...(player?.permissions ?? [])];
		editingPlayerUuid = uuid;
		playerModalOpen = true;
	}

	$effect(() => { if (!playerModalOpen) editingPlayerUuid = null; });

	function handlePermKey(e: KeyboardEvent) {
		const input = e.target as HTMLInputElement;
		const last = input.value[input.value.length - 1];
		if (last === ',' || last === ' ') {
			e.preventDefault();
			const text = input.value.slice(0, -1).trim();
			if (text && !permItems.includes(text)) permItems.push(text);
			input.value = '';
		}
	}

	function removePerm(p: string) {
		permItems = permItems.filter((x) => x !== p);
	}

	// --- Warps ---
	let editingWarpName = $state<string | null>(null);
	let warpModalOpen = $state(false);
	let createWarpOpen = $state(false);
	let editingWarp = $derived(data.warps.find((w) => w.name === editingWarpName) ?? null);

	$effect(() => { if (!warpModalOpen) editingWarpName = null; });

	// --- Worlds ---
	let editingWorldName = $state<string | null>(null);
	let worldModalOpen = $state(false);
	let createWorldOpen = $state(false);
	let editingWorld = $derived(data.worlds.find((w) => w.name === editingWorldName) ?? null);

	$effect(() => { if (!worldModalOpen) editingWorldName = null; });

	// --- Groups ---
	let editingGroupName = $state<string | null>(null);
	let groupModalOpen = $state(false);
	let createGroupOpen = $state(false);
	let editingGroup = $derived(data.groups.find((g) => g.name === editingGroupName) ?? null);
	let editGroupGameMode = $state(0);
	let createGroupGameMode = $state(0);

	$effect(() => { if (!groupModalOpen) editingGroupName = null; });

	function openGroupEdit(name: string) {
		const group = data.groups.find((g) => g.name === name);
		editGroupGameMode = group?.gameMode ?? 0;
		editingGroupName = name;
		groupModalOpen = true;
	}

	// --- User view ---
	let viewUserOpen = $state(false);
	let viewingUser = $state<(typeof data.mcUsers)[0]['user'] | null>(null);

	function openViewUser(user: (typeof data.mcUsers)[0]['user']) {
		viewingUser = user;
		viewUserOpen = true;
	}

	const ROLE_CHIP: Record<string, string> = {
		admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
		moderator: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
		developer: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
		supporter: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
		betatester: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
		trusted: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
		user: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
		bot: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'
	};

	// --- Helpers ---
	function fmtLoc(loc: string | null) {
		if (!loc) return '-';
		const get = (key: string) => {
			const m = loc.match(new RegExp(`(?:^|,)${key}=([^,]+)`));
			return m ? m[1] : null;
		};
		const world = get('world') ?? '';
		const x = Math.round(parseFloat(get('x') ?? '0') || 0);
		const y = Math.round(parseFloat(get('y') ?? '0') || 0);
		const z = Math.round(parseFloat(get('z') ?? '0') || 0);
		return world ? `${world} (${x}, ${y}, ${z})` : `${x}, ${y}, ${z}`;
	}

	function closeOn(open: (v: boolean) => void) {
		return () =>
			async ({ result, update }: { result: ActionResult; update: () => Promise<void> }) => {
				if (result.type === 'success') open(false);
				await update();
			};
	}

	const GM_ICON = { 0: Pickaxe, 1: Wand2, 2: Compass, 3: Eye } as const;
	const GM_LABEL = { 0: 'Survival', 1: 'Creative', 2: 'Adventure', 3: 'Spectator' } as const;
	const GM_KEYS = [0, 1, 2, 3] as const;

	function homeWorld(loc: string | null) {
		if (!loc) return null;
		const m = loc.match(/(?:^|,)world=([^,]+)/);
		return m ? m[1] : null;
	}
</script>

{#snippet rowActions(onEdit: () => void, deleteAction: string, deleteFields: Record<string, string>)}
	<div class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
		<button
			onclick={onEdit}
			class="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
			title="Edit"
		>
			<Pencil size={13} />
		</button>
		<form method="POST" action={deleteAction} use:enhance>
			{#each Object.entries(deleteFields) as [k, v]}
				<input type="hidden" name={k} value={v} />
			{/each}
			<button
				type="submit"
				class="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
				title="Delete"
			>
				<Trash2 size={13} />
			</button>
		</form>
	</div>
{/snippet}

{#snippet gameModePicker(current: number, set: (v: number) => void, inputName: string)}
	<input type="hidden" name={inputName} value={current} />
	<div class="flex overflow-hidden rounded-md border">
		{#each GM_KEYS as val}
			{@const Icon = GM_ICON[val]}
			<button
				type="button"
				onclick={() => set(val)}
				class="flex flex-1 items-center justify-center gap-1.5 px-3 py-1.5 text-xs transition-colors {current === val
					? 'bg-primary text-primary-foreground'
					: 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
				title={GM_LABEL[val]}
			>
				<Icon size={12} />
				{GM_LABEL[val]}
			</button>
		{/each}
	</div>
{/snippet}

<div class="mx-auto max-w-7xl px-6 py-4">
		<div class="mb-4 flex gap-1 border-b">
			{#each ['players', 'warps', 'worlds', 'groups'] as tab}
				<button
					class="px-4 py-2 text-sm font-medium transition-colors {currentTab === tab
						? 'border-b-2 border-primary text-primary'
						: 'text-muted-foreground hover:text-foreground'}"
					onclick={() => (currentTab = tab)}
				>
					{tab.charAt(0).toUpperCase() + tab.slice(1)}
				</button>
			{/each}
		</div>

		<!-- PLAYERS -->
		{#if currentTab === 'players'}
			<div class="mb-3">
				<Button.Root onclick={() => (createPlayerOpen = true)} size="sm" class="gap-1.5">
					<Plus size={14} /> New Player
				</Button.Root>
			</div>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-36">MC Name</Table.Head>
						<Table.Head class="w-32">Account</Table.Head>
						<Table.Head class="w-20 text-center">Perms</Table.Head>
						<Table.Head class="w-28">Home</Table.Head>
						<Table.Head class="w-32">Sanctions</Table.Head>
						<Table.Head class="w-16"></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.mcUsers as mc (mc.uuid)}
						<Table.Row class="hover:bg-muted/40 group">
							<Table.Cell class="py-1.5 font-medium">{mc.name}</Table.Cell>
							<Table.Cell class="py-1.5 text-xs">
								<button onclick={() => openViewUser(mc.user)} class="text-muted-foreground hover:text-foreground hover:underline">
									{mc.user.username}
								</button>
							</Table.Cell>
							<Table.Cell class="py-1.5 text-center text-sm">{mc.permissions.length}</Table.Cell>
							<Table.Cell class="py-1.5 text-xs">
								{@const hw = homeWorld(mc.homeLocation)}
								{#if hw && data.worlds.some((w) => w.name === hw)}
									<button onclick={() => { editingWorldName = hw; worldModalOpen = true; }} class="text-muted-foreground hover:text-foreground hover:underline">
										{hw}
									</button>
								{:else}
									<span class="text-muted-foreground">{hw ?? '-'}</span>
								{/if}
							</Table.Cell>
							<Table.Cell class="py-1.5">
								<div class="flex gap-1">
									{#if mc.bannedUntil}
										<span class="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">banned</span>
									{/if}
									{#if mc.mutedUntil}
										<span class="rounded bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500">muted</span>
									{/if}
									{#if !mc.bannedUntil && !mc.mutedUntil}
										<span class="text-xs text-muted-foreground">-</span>
									{/if}
								</div>
							</Table.Cell>
							<Table.Cell class="py-1.5">
								{@render rowActions(() => openPlayerEdit(mc.uuid), '?/mcUserDelete', { uuid: mc.uuid })}
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		{/if}

		<!-- WARPS -->
		{#if currentTab === 'warps'}
			<div class="mb-3">
				<Button.Root onclick={() => (createWarpOpen = true)} size="sm" class="gap-1.5">
					<Plus size={14} /> New Warp
				</Button.Root>
			</div>
			<Table.Root class="table-fixed w-full">
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-32">Name</Table.Head>
						<Table.Head class="w-52">Location</Table.Head>
						<Table.Head>Restrictions</Table.Head>
						<Table.Head class="w-16"></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.warps as warp (warp.name)}
						<Table.Row class="hover:bg-muted/40 group">
							<Table.Cell class="py-1.5 font-medium">{warp.name}</Table.Cell>
							<Table.Cell class="py-1.5" title={warp.location ?? ''}>
								{@const ww = homeWorld(warp.location)}
								{#if ww && data.worlds.some((w) => w.name === ww)}
									<button onclick={() => { editingWorldName = ww; worldModalOpen = true; }} class="font-mono text-xs text-muted-foreground hover:text-foreground hover:underline">
										{fmtLoc(warp.location)}
									</button>
								{:else}
									<span class="font-mono text-xs text-muted-foreground">{fmtLoc(warp.location)}</span>
								{/if}
							</Table.Cell>
							<Table.Cell class="overflow-hidden py-1.5">
								<RestrictEditor value={warp.restrict ?? []} readonly users={data.users} />
							</Table.Cell>
							<Table.Cell class="py-1.5">
								{@render rowActions(() => { editingWarpName = warp.name; warpModalOpen = true; }, '?/warpDelete', { name: warp.name })}
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		{/if}

		<!-- WORLDS -->
		{#if currentTab === 'worlds'}
			<div class="mb-3">
				<Button.Root onclick={() => (createWorldOpen = true)} size="sm" class="gap-1.5">
					<Plus size={14} /> New World
				</Button.Root>
			</div>
			<Table.Root class="table-fixed w-full">
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-32">Name</Table.Head>
						<Table.Head class="w-36">Group</Table.Head>
						<Table.Head>Restrictions</Table.Head>
						<Table.Head class="w-16"></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.worlds as world (world.name)}
						<Table.Row class="hover:bg-muted/40 group">
							<Table.Cell class="py-1.5 font-medium">{world.name}</Table.Cell>
							<Table.Cell class="py-1.5">
								<button onclick={() => openGroupEdit(world.groupName)} class="text-sm text-muted-foreground hover:text-foreground hover:underline">
									{world.groupName}
								</button>
							</Table.Cell>
							<Table.Cell class="overflow-hidden py-1.5">
								<RestrictEditor value={world.restrict ?? []} readonly users={data.users} />
							</Table.Cell>
							<Table.Cell class="py-1.5">
								{@render rowActions(
									() => { editingWorldName = world.name; worldModalOpen = true; },
									'?/worldDelete',
									{ name: world.name }
								)}
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		{/if}

		<!-- GROUPS -->
		{#if currentTab === 'groups'}
			<div class="mb-3">
				<Button.Root onclick={() => (createGroupOpen = true)} size="sm" class="gap-1.5">
					<Plus size={14} /> New Group
				</Button.Root>
			</div>
			<Table.Root class="table-fixed w-full">
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-32">Name</Table.Head>
						<Table.Head class="w-32">Mode</Table.Head>
						<Table.Head>Restrictions</Table.Head>
						<Table.Head class="w-16"></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.groups as group (group.name)}
						{@const GmIcon = GM_ICON[group.gameMode as keyof typeof GM_ICON] ?? Pickaxe}
						<Table.Row class="hover:bg-muted/40 group">
							<Table.Cell class="py-1.5 font-medium">{group.name}</Table.Cell>
							<Table.Cell class="py-1.5">
								<span class="flex items-center gap-1.5 text-sm text-muted-foreground">
									<GmIcon size={13} />
									{GM_LABEL[group.gameMode as keyof typeof GM_LABEL] ?? group.gameMode}
								</span>
							</Table.Cell>
							<Table.Cell class="overflow-hidden py-1.5">
								<RestrictEditor value={group.restrict ?? []} readonly users={data.users} />
							</Table.Cell>
							<Table.Cell class="py-1.5">
								{@render rowActions(
									() => openGroupEdit(group.name),
									'?/groupDelete',
									{ name: group.name }
								)}
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		{/if}
	</div>

<!-- Player Edit Modal -->
{#if editingPlayer}
	<Modal bind:open={playerModalOpen} title="Edit Player: {editingPlayer.name}" wide>
		<div class="space-y-5">
			<p class="text-xs text-muted-foreground">UUID: <span class="font-mono">{editingPlayer.uuid}</span></p>

			<form method="POST" action="?/mcUserUpdate" use:enhance class="space-y-3">
				<input type="hidden" name="uuid" value={editingPlayer.uuid} />
				<div>
					<label for="plr-welcome" class="mb-1 block text-xs font-medium text-muted-foreground">Welcome Message</label>
					<Input.Root id="plr-welcome" name="welcomeMessage" value={editingPlayer.welcomeMessage ?? ''} placeholder="None" />
				</div>
				<div>
					<p class="mb-1 text-xs font-medium text-muted-foreground">Home Location</p>
					<LocationEditor name="homeLocation" value={editingPlayer.homeLocation} worlds={worldNames} />
				</div>
				<Button.Root type="submit" size="sm">Save</Button.Root>
			</form>

			<div class="border-t pt-4">
				<form method="POST" action="?/mcUserUpdatePermissions" use:enhance class="space-y-2">
					<input type="hidden" name="uuid" value={editingPlayer.uuid} />
					<input type="hidden" name="permissions" value={permItems.join(',')} />
					<p class="text-xs font-medium text-muted-foreground">Permissions ({permItems.length})</p>
					<div class="flex min-h-10 flex-wrap gap-1.5 rounded-md border p-2">
						{#each permItems as perm (perm)}
							<span class="flex items-center gap-1 rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground">
								{perm}
								<button type="button" onclick={() => removePerm(perm)} class="opacity-70 hover:opacity-100">×</button>
							</span>
						{/each}
						<input
							type="text"
							placeholder="Type and press space or comma…"
							class="min-w-32 flex-1 bg-transparent text-xs outline-none"
							onkeydown={handlePermKey}
						/>
					</div>
					<Button.Root type="submit" size="sm" variant="outline">Save Permissions</Button.Root>
				</form>
			</div>

			<div class="border-t pt-4 space-y-2">
				<p class="text-xs font-medium text-muted-foreground">Ban</p>
				{#if editingPlayer.bannedUntil}
					<div class="flex items-center justify-between rounded border border-red-200 bg-red-50 px-3 py-2 text-xs dark:border-red-800 dark:bg-red-950/20">
						<div>
							<span class="font-medium text-red-700 dark:text-red-400">Until:</span>
							<span class="ml-1 text-red-600">{new Date(editingPlayer.bannedUntil).toLocaleString()}</span>
							{#if editingPlayer.bannedReason}
								<span class="ml-1 text-red-500">- {editingPlayer.bannedReason}</span>
							{/if}
						</div>
						<form method="POST" action="?/mcUserBan" use:enhance class="ml-3 shrink-0">
							<input type="hidden" name="uuid" value={editingPlayer.uuid} />
							<input type="hidden" name="until" value="" />
							<Button.Root type="submit" size="sm" variant="outline" class="h-6 border-red-300 px-2 text-xs text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-400">Lift</Button.Root>
						</form>
					</div>
				{/if}
				<form method="POST" action="?/mcUserBan" use:enhance class="flex items-end gap-2">
					<input type="hidden" name="uuid" value={editingPlayer.uuid} />
					<div class="flex-1">
						<label for="ban-until" class="mb-1 block text-xs text-muted-foreground">Until</label>
						<Input.Root id="ban-until" type="datetime-local" name="until" required />
					</div>
					<div class="flex-1">
						<label for="ban-reason" class="mb-1 block text-xs text-muted-foreground">Reason</label>
						<Input.Root id="ban-reason" name="reason" placeholder="Optional" />
					</div>
					<Button.Root type="submit" size="sm" variant="destructive" class="shrink-0">Ban</Button.Root>
				</form>
			</div>

			<div class="border-t pt-4 space-y-2">
				<p class="text-xs font-medium text-muted-foreground">Mute</p>
				{#if editingPlayer.mutedUntil}
					<div class="flex items-center justify-between rounded border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs dark:border-yellow-800 dark:bg-yellow-950/20">
						<div>
							<span class="font-medium text-yellow-700 dark:text-yellow-400">Until:</span>
							<span class="ml-1 text-yellow-600">{new Date(editingPlayer.mutedUntil).toLocaleString()}</span>
						</div>
						<form method="POST" action="?/mcUserMute" use:enhance class="ml-3 shrink-0">
							<input type="hidden" name="uuid" value={editingPlayer.uuid} />
							<input type="hidden" name="until" value="" />
							<Button.Root type="submit" size="sm" variant="outline" class="h-6 border-yellow-300 px-2 text-xs text-yellow-700 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-400">Lift</Button.Root>
						</form>
					</div>
				{/if}
				<form method="POST" action="?/mcUserMute" use:enhance class="flex items-end gap-2">
					<input type="hidden" name="uuid" value={editingPlayer.uuid} />
					<div>
						<label for="mute-until" class="mb-1 block text-xs text-muted-foreground">Until</label>
						<Input.Root id="mute-until" type="datetime-local" name="until" required />
					</div>
					<Button.Root type="submit" size="sm" variant="outline" class="shrink-0 border-yellow-400 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-600 dark:text-yellow-400">Mute</Button.Root>
				</form>
			</div>
		</div>
	</Modal>
{/if}

<!-- Warp Edit Modal -->
{#if editingWarp}
	<Modal bind:open={warpModalOpen} title="Edit Warp: {editingWarp.name}" wide>
		<form method="POST" action="?/warpUpdate" use:enhance={closeOn((v) => (warpModalOpen = v))} class="space-y-4">
			<input type="hidden" name="oldName" value={editingWarp.name} />
			<div>
				<label for="warp-name" class="mb-1 block text-xs font-medium text-muted-foreground">Name</label>
				<Input.Root id="warp-name" name="name" value={editingWarp.name} required />
			</div>
			<div>
				<p class="mb-1 text-xs font-medium text-muted-foreground">Location</p>
				<LocationEditor name="location" value={editingWarp.location} worlds={worldNames} />
			</div>
			<div>
				<p class="mb-1 text-xs font-medium text-muted-foreground">Restrictions</p>
				<RestrictEditor name="restrict" value={editingWarp.restrict ?? []} users={data.users} />
			</div>
			<Button.Root type="submit" size="sm">Save</Button.Root>
		</form>
	</Modal>
{/if}

<!-- World Edit Modal -->
{#if editingWorld}
	<Modal bind:open={worldModalOpen} title="Edit World: {editingWorld.name}">
		<form method="POST" action="?/worldUpdate" use:enhance={closeOn((v) => (worldModalOpen = v))} class="space-y-4">
			<input type="hidden" name="oldName" value={editingWorld.name} />
			<div>
				<label for="world-name" class="mb-1 block text-xs font-medium text-muted-foreground">Name</label>
				<Input.Root id="world-name" name="name" value={editingWorld.name} required />
			</div>
			<div>
				<label for="world-group" class="mb-1 block text-xs font-medium text-muted-foreground">World Group</label>
				<select id="world-group" name="groupName" class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" required>
					{#each data.groups as g}
						<option value={g.name} selected={g.name === editingWorld.groupName}>{g.name}</option>
					{/each}
				</select>
			</div>
			<div>
				<p class="mb-1 text-xs font-medium text-muted-foreground">Restrictions</p>
				<RestrictEditor name="restrict" value={editingWorld.restrict ?? []} users={data.users} />
			</div>
			<Button.Root type="submit" size="sm">Save</Button.Root>
		</form>
	</Modal>
{/if}

<!-- Group Edit Modal -->
{#if editingGroup}
	<Modal bind:open={groupModalOpen} title="Edit Group: {editingGroup.name}">
		<form method="POST" action="?/groupUpdate" use:enhance={closeOn((v) => (groupModalOpen = v))} class="space-y-4">
			<input type="hidden" name="oldName" value={editingGroup.name} />
			<div>
				<label for="group-name" class="mb-1 block text-xs font-medium text-muted-foreground">Name</label>
				<Input.Root id="group-name" name="name" value={editingGroup.name} required />
			</div>
			<div>
				<p class="mb-1 text-xs font-medium text-muted-foreground">Game Mode</p>
				{@render gameModePicker(editGroupGameMode, (v) => (editGroupGameMode = v), 'gameMode')}
			</div>
			<div>
				<p class="mb-1 text-xs font-medium text-muted-foreground">Restrictions</p>
				<RestrictEditor name="restrict" value={editingGroup.restrict ?? []} users={data.users} />
			</div>
			<Button.Root type="submit" size="sm">Save</Button.Root>
		</form>
	</Modal>
{/if}

<!-- Create Player Modal -->
<Modal bind:open={createPlayerOpen} title="New Player">
	<form method="POST" action="?/mcUserCreate" use:enhance={closeOn((v) => (createPlayerOpen = v))} class="space-y-4">
		<div>
			<label for="cp-user" class="mb-1 block text-xs font-medium text-muted-foreground">Account</label>
			<select id="cp-user" name="userId" class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" required>
				<option value="">Select user</option>
				{#each data.unassignedUsers as u}
					<option value={u.id}>{u.username}</option>
				{/each}
			</select>
		</div>
		<div>
			<label for="cp-name" class="mb-1 block text-xs font-medium text-muted-foreground">MC Username</label>
			<div class="relative">
				<input
					id="cp-name"
					name="name"
					placeholder="Steve"
					required
					value={cpName}
					oninput={(e) => { cpName = e.currentTarget.value; cpNameState = 'idle'; cpValidateError = ''; }}
					onpaste={cpHandleNamePaste}
					onblur={cpHandleNameBlur}
					class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pr-8 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring {cpNameState === 'invalid' ? 'border-destructive' : cpNameState === 'valid' ? 'border-green-500' : ''}"
				/>
				{#if cpNameState === 'loading'}
					<Loader2 size={14} class="absolute right-2.5 top-2.5 animate-spin text-muted-foreground" />
				{:else if cpNameState === 'valid'}
					<CheckCircle2 size={14} class="absolute right-2.5 top-2.5 text-green-500" />
				{:else if cpNameState === 'invalid'}
					<XCircle size={14} class="absolute right-2.5 top-2.5 text-destructive" />
				{/if}
			</div>
		</div>
		<div>
			<label for="cp-uuid" class="mb-1 block text-xs font-medium text-muted-foreground">UUID</label>
			<div class="relative">
				<input
					id="cp-uuid"
					name="uuid"
					placeholder="00000000-0000-0000-0000-000000000000"
					required
					value={cpUuid}
					oninput={(e) => { cpUuid = e.currentTarget.value; cpUuidState = 'idle'; cpValidateError = ''; }}
					onpaste={cpHandleUuidPaste}
					onblur={cpHandleUuidBlur}
					class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pr-8 font-mono text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring {cpUuidState === 'invalid' ? 'border-destructive' : cpUuidState === 'valid' ? 'border-green-500' : ''}"
				/>
				{#if cpUuidState === 'loading'}
					<Loader2 size={14} class="absolute right-2.5 top-2.5 animate-spin text-muted-foreground" />
				{:else if cpUuidState === 'valid'}
					<CheckCircle2 size={14} class="absolute right-2.5 top-2.5 text-green-500" />
				{:else if cpUuidState === 'invalid'}
					<XCircle size={14} class="absolute right-2.5 top-2.5 text-destructive" />
				{/if}
			</div>
			{#if cpValidateError}
				<p class="mt-1 text-xs text-destructive">{cpValidateError}</p>
			{/if}
			{#if cpNameState === 'valid'}
				<p class="mt-1 text-xs text-muted-foreground">Verified with Mojang</p>
			{/if}
		</div>
		<Button.Root type="submit" size="sm" disabled={cpNameState === 'loading' || cpUuidState === 'loading'}>Create</Button.Root>
	</form>
</Modal>

<!-- Create Warp Modal -->
<Modal bind:open={createWarpOpen} title="New Warp" wide>
	<form method="POST" action="?/warpCreate" use:enhance={closeOn((v) => (createWarpOpen = v))} class="space-y-4">
		<div>
			<label for="cw-name" class="mb-1 block text-xs font-medium text-muted-foreground">Name</label>
			<Input.Root id="cw-name" name="name" placeholder="spawn" required />
		</div>
		<div>
			<p class="mb-1 text-xs font-medium text-muted-foreground">Location</p>
			<LocationEditor name="location" worlds={worldNames} />
		</div>
		<div>
			<p class="mb-1 text-xs font-medium text-muted-foreground">Restrictions</p>
			<RestrictEditor name="restrict" users={data.users} />
		</div>
		<Button.Root type="submit" size="sm">Create</Button.Root>
	</form>
</Modal>

<!-- Create World Modal -->
<Modal bind:open={createWorldOpen} title="New World">
	<form method="POST" action="?/worldCreate" use:enhance={closeOn((v) => (createWorldOpen = v))} class="space-y-4">
		<div>
			<label for="cwld-name" class="mb-1 block text-xs font-medium text-muted-foreground">Name</label>
			<Input.Root id="cwld-name" name="name" placeholder="world" required />
		</div>
		<div>
			<label for="cwld-group" class="mb-1 block text-xs font-medium text-muted-foreground">World Group</label>
			<select id="cwld-group" name="groupName" class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" required>
				<option value="">Select group</option>
				{#each data.groups as g}
					<option value={g.name}>{g.name}</option>
				{/each}
			</select>
		</div>
		<div>
			<p class="mb-1 text-xs font-medium text-muted-foreground">Restrictions</p>
			<RestrictEditor name="restrict" users={data.users} />
		</div>
		<Button.Root type="submit" size="sm">Create</Button.Root>
	</form>
</Modal>

<!-- User View Modal -->
{#if viewingUser}
	<Modal bind:open={viewUserOpen} title={viewingUser.username}>
		<div class="space-y-3">
			<div class="flex flex-wrap gap-1">
				{#each viewingUser.roles as role}
					<span class="rounded px-1.5 py-0.5 text-xs font-medium {ROLE_CHIP[role] ?? 'bg-gray-100 text-gray-600'}">{role}</span>
				{/each}
			</div>
			<div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
				<span class="text-muted-foreground">Email</span><span>{viewingUser.email}</span>
				<span class="text-muted-foreground">Credit</span><span class="tabular-nums">{viewingUser.credit}</span>
				<span class="text-muted-foreground">Last online</span>
				<span>{new Date(viewingUser.lastOnline).toLocaleDateString('en', { month: 'short', day: 'numeric', year: '2-digit' })}</span>
			</div>
			<div class="pt-1 text-xs text-muted-foreground">
				ID: <span class="font-mono">{viewingUser.id}</span>
			</div>
		</div>
	</Modal>
{/if}

<!-- Create Group Modal -->
<Modal bind:open={createGroupOpen} title="New World Group">
	<form method="POST" action="?/groupCreate" use:enhance={closeOn((v) => (createGroupOpen = v))} class="space-y-4">
		<div>
			<label for="cg-name" class="mb-1 block text-xs font-medium text-muted-foreground">Name</label>
			<Input.Root id="cg-name" name="name" placeholder="survival" required />
		</div>
		<div>
			<p class="mb-1 text-xs font-medium text-muted-foreground">Game Mode</p>
			{@render gameModePicker(createGroupGameMode, (v) => (createGroupGameMode = v), 'gameMode')}
		</div>
		<div>
			<p class="mb-1 text-xs font-medium text-muted-foreground">Restrictions</p>
			<RestrictEditor name="restrict" users={data.users} />
		</div>
		<Button.Root type="submit" size="sm">Create</Button.Root>
	</form>
</Modal>
