<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionResult } from '@sveltejs/kit';
	import { Plus, Settings, Pencil, Trash2 } from '@lucide/svelte';
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

<div class="min-h-screen bg-background">
	<div class="border-b">
		<div class="mx-auto max-w-7xl px-6 py-3">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<Settings class="h-4 w-4 text-muted-foreground" />
					<h1 class="font-semibold">Minecraft</h1>
				</div>
				<Button.Root href="/admin" variant="outline" size="sm">Back to Users</Button.Root>
			</div>
		</div>
	</div>

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
						<Table.Head class="w-32">Sanctions</Table.Head>
						<Table.Head class="w-16"></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.mcUsers as mc (mc.uuid)}
						<Table.Row class="hover:bg-muted/40 group">
							<Table.Cell class="py-1.5 font-medium">{mc.name}</Table.Cell>
							<Table.Cell class="py-1.5 text-xs text-muted-foreground">{mc.user.username}</Table.Cell>
							<Table.Cell class="py-1.5 text-center text-sm">{mc.permissions.length}</Table.Cell>
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
							<Table.Cell class="truncate py-1.5 font-mono text-xs text-muted-foreground" title={warp.location ?? ''}>
								{fmtLoc(warp.location)}
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
							<Table.Cell class="py-1.5 text-sm text-muted-foreground">{world.groupName}</Table.Cell>
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

			{#if editingPlayer.bannedUntil}
				<div class="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs dark:border-red-800 dark:bg-red-950/20">
					<span class="font-medium text-red-700 dark:text-red-400">Banned until:</span>
					<span class="ml-1 text-red-600">{new Date(editingPlayer.bannedUntil).toLocaleString()}</span>
					{#if editingPlayer.bannedReason}
						<span class="ml-1 text-red-500">- {editingPlayer.bannedReason}</span>
					{/if}
				</div>
			{/if}

			{#if editingPlayer.mutedUntil}
				<div class="rounded border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs dark:border-yellow-800 dark:bg-yellow-950/20">
					<span class="font-medium text-yellow-700 dark:text-yellow-400">Muted until:</span>
					<span class="ml-1 text-yellow-600">{new Date(editingPlayer.mutedUntil).toLocaleString()}</span>
				</div>
			{/if}
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
			<Input.Root id="cp-name" name="name" placeholder="Steve" required />
		</div>
		<div>
			<label for="cp-uuid" class="mb-1 block text-xs font-medium text-muted-foreground">UUID</label>
			<Input.Root id="cp-uuid" name="uuid" placeholder="00000000-0000-0000-0000-000000000000" class="font-mono" required />
		</div>
		<Button.Root type="submit" size="sm">Create</Button.Root>
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
