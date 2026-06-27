<script lang="ts">
	import { enhance } from '$app/forms';
	import { Bot, Pencil, Trash2, Plus } from '@lucide/svelte';
	import * as Table from '$shadcn/table';
	import * as Button from '$shadcn/button';
	import * as Input from '$shadcn/input';
	import Modal from '$lib/components/Modal.svelte';

	let { data } = $props();

	type DcUser = (typeof data.dcUsers)[0];

	const ROLE_CHIP: Record<string, string> = {
		admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
		moderator: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
		developer: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
		supporter: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
		betatester: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
		trusted: 'bg-yellow-100 text-yellow-700 dark:bg-gray-800 dark:text-gray-400',
		user: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
		bot: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'
	};

	let modalOpen = $state(false);
	let modalMode = $state<'create' | 'edit'>('create');
	let editingDc = $state<DcUser | null>(null);
	let dcName = $state('');
	let dcDiscordId = $state('');
	let dcUserId = $state('');

	// --- User view ---
	let viewUserOpen = $state(false);
	let viewingUser = $state<DcUser['user'] | null>(null);

	function openViewUser(user: DcUser['user']) {
		viewingUser = user;
		viewUserOpen = true;
	}

	function openCreate() {
		modalMode = 'create';
		editingDc = null;
		dcName = '';
		dcDiscordId = '';
		dcUserId = data.users[0]?.id ?? '';
		modalOpen = true;
	}

	function openEdit(dc: DcUser) {
		modalMode = 'edit';
		editingDc = dc;
		dcName = dc.name;
		dcDiscordId = dc.discordUserId;
		dcUserId = dc.userId;
		modalOpen = true;
	}
</script>

<div class="mx-auto max-w-7xl px-6 py-4">
	<div class="mb-3 flex items-center gap-3">
		<Button.Root size="sm" onclick={openCreate}>
			<Plus size={14} />
			Add User
		</Button.Root>
		<div class="flex items-center gap-2 text-sm text-muted-foreground">
			<Bot class="h-4 w-4" />
			<span>Discord Users</span>
			<span class="text-xs">({data.dcUsers.length})</span>
		</div>
	</div>

	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>Discord Name</Table.Head>
				<Table.Head>Discord User ID</Table.Head>
				<Table.Head>Account</Table.Head>
				<Table.Head class="w-16"></Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each data.dcUsers as dc (dc.discordUserId)}
				<Table.Row class="hover:bg-muted/40 group">
					<Table.Cell class="py-1.5 font-medium">{dc.name}</Table.Cell>
					<Table.Cell class="py-1.5 font-mono text-xs text-muted-foreground">{dc.discordUserId}</Table.Cell>
					<Table.Cell class="py-1.5">
						{#if dc.user}
							<button onclick={() => openViewUser(dc.user)} class="text-sm text-muted-foreground hover:text-foreground hover:underline">
								{dc.user.username}
							</button>
						{:else}
							<span class="text-sm text-muted-foreground">-</span>
						{/if}
					</Table.Cell>
					<Table.Cell class="py-1.5">
						<div class="flex items-center gap-1 opacity-0 transition-all group-hover:opacity-100">
							<button
								onclick={() => openEdit(dc)}
								class="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
								title="Edit"
							>
								<Pencil size={13} />
							</button>
							<form method="POST" action="?/userDelete" use:enhance>
								<input type="hidden" name="discordUserId" value={dc.discordUserId} />
								<button type="submit" class="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Delete">
									<Trash2 size={13} />
								</button>
							</form>
						</div>
					</Table.Cell>
				</Table.Row>
			{/each}
			{#if data.dcUsers.length === 0}
				<Table.Row>
					<Table.Cell colspan={4} class="py-8 text-center text-sm text-muted-foreground">No Discord users linked</Table.Cell>
				</Table.Row>
			{/if}
		</Table.Body>
	</Table.Root>
</div>

<!-- DC USER MODAL -->
<Modal bind:open={modalOpen} title={modalMode === 'create' ? 'Add Discord User' : 'Edit Discord User'}>
	<form
		method="POST"
		action={modalMode === 'create' ? '?/userCreate' : '?/userUpdate'}
		use:enhance={() =>
			async ({ result, update }) => {
				if (result.type === 'success') modalOpen = false;
				await update();
			}}
		class="space-y-3"
	>
		<div>
			<label for="dc-name" class="mb-1 block text-xs font-medium text-muted-foreground">Discord Name</label>
			<Input.Root id="dc-name" name="name" bind:value={dcName} placeholder="username#1234" required />
		</div>
		<div>
			<label for="dc-id" class="mb-1 block text-xs font-medium text-muted-foreground">Discord User ID</label>
			<Input.Root id="dc-id" name="discordUserId" bind:value={dcDiscordId} placeholder="123456789012345678" required readonly={modalMode === 'edit'} />
		</div>
		<div>
			<label for="dc-user" class="mb-1 block text-xs font-medium text-muted-foreground">RizinOS Account</label>
			<select
				id="dc-user"
				name="userId"
				bind:value={dcUserId}
				class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
				required
			>
				{#each data.users as u (u.id)}
					<option value={u.id}>{u.username}</option>
				{/each}
			</select>
		</div>
		<div class="flex justify-end gap-2 pt-2">
			<Button.Root type="button" variant="outline" size="sm" onclick={() => (modalOpen = false)}>Cancel</Button.Root>
			<Button.Root type="submit" size="sm">{modalMode === 'create' ? 'Create' : 'Save'}</Button.Root>
		</div>
	</form>
</Modal>

<!-- USER VIEW MODAL -->
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
