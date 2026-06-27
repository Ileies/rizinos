<script lang="ts">
	import { enhance } from '$app/forms';
	import { Users, Webhook, Server, Pencil, Trash2, Plus } from '@lucide/svelte';
	import * as Table from '$shadcn/table';
	import * as Button from '$shadcn/button';
	import * as Input from '$shadcn/input';
	import Modal from '$lib/components/Modal.svelte';

	let { data } = $props();

	let currentTab = $state('users');

	const innerTabs = [
		{ id: 'users', label: 'Users', icon: Users, count: () => data.users.length },
		{ id: 'hooks', label: 'Hooks', icon: Webhook, count: () => data.hooks.length },
		{ id: 'servers', label: 'Servers', icon: Server, count: () => data.servers.length }
	];

	type McUser = (typeof data.users)[0];
	type McHook = (typeof data.hooks)[0];
	type McServer = (typeof data.servers)[0];

	// --- Users ---
	let userModalOpen = $state(false);
	let userModalMode = $state<'create' | 'edit'>('create');
	let editingUser = $state<McUser | null>(null);
	let uUuid = $state('');
	let uDiscordId = $state('');
	let uMcName = $state('');
	let uToken = $state('');

	function openUserCreate() {
		userModalMode = 'create';
		editingUser = null;
		uUuid = '';
		uDiscordId = '';
		uMcName = '';
		uToken = '';
		userModalOpen = true;
	}

	function openUserEdit(u: McUser) {
		userModalMode = 'edit';
		editingUser = u;
		uUuid = u.minecraftUuid;
		uDiscordId = u.discordUserId;
		uMcName = u.minecraftName;
		uToken = u.token ?? '';
		userModalOpen = true;
	}

	// --- Hooks ---
	let hookModalOpen = $state(false);
	let hookModalMode = $state<'create' | 'edit'>('create');
	let editingHook = $state<McHook | null>(null);
	let hWebhookId = $state('');
	let hChannelId = $state('');
	let hToken = $state('');
	let hServerId = $state('');
	let hPrefix = $state('<%1> ');

	function openHookCreate() {
		hookModalMode = 'create';
		editingHook = null;
		hWebhookId = '';
		hChannelId = '';
		hToken = '';
		hServerId = data.servers[0]?.serverId ?? '';
		hPrefix = '<%1> ';
		hookModalOpen = true;
	}

	function openHookEdit(h: McHook) {
		hookModalMode = 'edit';
		editingHook = h;
		hWebhookId = h.webhookId;
		hChannelId = h.channelId;
		hToken = h.token;
		hServerId = h.minecraftServerId;
		hPrefix = h.prefix;
		hookModalOpen = true;
	}

	// --- Servers ---
	let serverModalOpen = $state(false);
	let serverModalMode = $state<'create' | 'edit'>('create');
	let editingServer = $state<McServer | null>(null);
	let sId = $state('');
	let sIp = $state('');

	function openServerCreate() {
		serverModalMode = 'create';
		editingServer = null;
		sId = '';
		sIp = '';
		serverModalOpen = true;
	}

	function openServerEdit(s: McServer) {
		serverModalMode = 'edit';
		editingServer = s;
		sId = s.serverId;
		sIp = s.ip;
		serverModalOpen = true;
	}
</script>

<div class="mx-auto max-w-7xl px-6 py-4">
	<div class="mb-4 flex gap-1 border-b">
		{#each innerTabs as tab}
			{@const Icon = tab.icon}
			<button
				class="flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors {currentTab === tab.id
					? 'border-b-2 border-primary text-primary'
					: 'text-muted-foreground hover:text-foreground'}"
				onclick={() => (currentTab = tab.id)}
			>
				<Icon class="h-3.5 w-3.5" />
				{tab.label}
				<span class="text-xs {currentTab === tab.id ? 'text-primary/70' : 'text-muted-foreground/60'}">({tab.count()})</span>
			</button>
		{/each}
	</div>

	<!-- USERS -->
	{#if currentTab === 'users'}
		<div class="mb-3">
			<Button.Root size="sm" onclick={openUserCreate}>
				<Plus size={14} />
				Add User
			</Button.Root>
		</div>
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>MC Name</Table.Head>
					<Table.Head>MC UUID</Table.Head>
					<Table.Head>Discord User ID</Table.Head>
					<Table.Head class="w-24">Token</Table.Head>
					<Table.Head class="w-16"></Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.users as user (user.minecraftUuid)}
					<Table.Row class="hover:bg-muted/40 group">
						<Table.Cell class="py-1.5 font-medium">{user.minecraftName}</Table.Cell>
						<Table.Cell class="py-1.5">
							<button onclick={() => openUserEdit(user)} class="font-mono text-xs text-muted-foreground hover:text-foreground hover:underline">
								{user.minecraftUuid}
							</button>
						</Table.Cell>
						<Table.Cell class="py-1.5 font-mono text-xs text-muted-foreground">{user.discordUserId}</Table.Cell>
						<Table.Cell class="py-1.5">
							{#if user.token}
								<span class="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400">set</span>
							{:else}
								<span class="text-xs text-muted-foreground/40">-</span>
							{/if}
						</Table.Cell>
						<Table.Cell class="py-1.5">
							<div class="flex items-center gap-1 opacity-0 transition-all group-hover:opacity-100">
								<button
									onclick={() => openUserEdit(user)}
									class="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
									title="Edit"
								>
									<Pencil size={13} />
								</button>
								<form method="POST" action="?/userDelete" use:enhance>
									<input type="hidden" name="minecraftUuid" value={user.minecraftUuid} />
									<button type="submit" class="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Delete">
										<Trash2 size={13} />
									</button>
								</form>
							</div>
						</Table.Cell>
					</Table.Row>
				{/each}
				{#if data.users.length === 0}
					<Table.Row>
						<Table.Cell colspan={5} class="py-8 text-center text-sm text-muted-foreground">No users</Table.Cell>
					</Table.Row>
				{/if}
			</Table.Body>
		</Table.Root>
	{/if}

	<!-- HOOKS -->
	{#if currentTab === 'hooks'}
		<div class="mb-3">
			<Button.Root size="sm" onclick={openHookCreate}>
				<Plus size={14} />
				Add Hook
			</Button.Root>
		</div>
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Webhook ID</Table.Head>
					<Table.Head>Channel ID</Table.Head>
					<Table.Head>Server</Table.Head>
					<Table.Head class="w-32">Prefix</Table.Head>
					<Table.Head class="w-24">Token</Table.Head>
					<Table.Head class="w-16"></Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.hooks as hook (hook.webhookId)}
					<Table.Row class="hover:bg-muted/40 group">
						<Table.Cell class="py-1.5 font-mono text-xs text-muted-foreground">{hook.webhookId}</Table.Cell>
						<Table.Cell class="py-1.5 font-mono text-xs text-muted-foreground">{hook.channelId}</Table.Cell>
						<Table.Cell class="py-1.5 text-sm">{hook.server?.ip ?? hook.minecraftServerId}</Table.Cell>
						<Table.Cell class="py-1.5 font-mono text-xs">{hook.prefix}</Table.Cell>
						<Table.Cell class="py-1.5 font-mono text-xs text-muted-foreground">
							<span class="block max-w-[80px] truncate" title={hook.token}>{hook.token}</span>
						</Table.Cell>
						<Table.Cell class="py-1.5">
							<div class="flex items-center gap-1 opacity-0 transition-all group-hover:opacity-100">
								<button
									onclick={() => openHookEdit(hook)}
									class="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
									title="Edit"
								>
									<Pencil size={13} />
								</button>
								<form method="POST" action="?/hookDelete" use:enhance>
									<input type="hidden" name="webhookId" value={hook.webhookId} />
									<button type="submit" class="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Delete">
										<Trash2 size={13} />
									</button>
								</form>
							</div>
						</Table.Cell>
					</Table.Row>
				{/each}
				{#if data.hooks.length === 0}
					<Table.Row>
						<Table.Cell colspan={6} class="py-8 text-center text-sm text-muted-foreground">No hooks</Table.Cell>
					</Table.Row>
				{/if}
			</Table.Body>
		</Table.Root>
	{/if}

	<!-- SERVERS -->
	{#if currentTab === 'servers'}
		<div class="mb-3">
			<Button.Root size="sm" onclick={openServerCreate}>
				<Plus size={14} />
				Add Server
			</Button.Root>
		</div>
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Server ID</Table.Head>
					<Table.Head>IP</Table.Head>
					<Table.Head class="w-32">Hook</Table.Head>
					<Table.Head class="w-16"></Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.servers as server (server.serverId)}
					<Table.Row class="hover:bg-muted/40 group">
						<Table.Cell class="py-1.5 font-mono text-sm">{server.serverId}</Table.Cell>
						<Table.Cell class="py-1.5 text-sm">{server.ip}</Table.Cell>
						<Table.Cell class="py-1.5">
							{#if server.hook}
								<span class="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400">linked</span>
							{:else}
								<span class="text-xs text-muted-foreground/40">none</span>
							{/if}
						</Table.Cell>
						<Table.Cell class="py-1.5">
							<div class="flex items-center gap-1 opacity-0 transition-all group-hover:opacity-100">
								<button
									onclick={() => openServerEdit(server)}
									class="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
									title="Edit"
								>
									<Pencil size={13} />
								</button>
								<form method="POST" action="?/serverDelete" use:enhance>
									<input type="hidden" name="serverId" value={server.serverId} />
									<button type="submit" class="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Delete">
										<Trash2 size={13} />
									</button>
								</form>
							</div>
						</Table.Cell>
					</Table.Row>
				{/each}
				{#if data.servers.length === 0}
					<Table.Row>
						<Table.Cell colspan={4} class="py-8 text-center text-sm text-muted-foreground">No servers</Table.Cell>
					</Table.Row>
				{/if}
			</Table.Body>
		</Table.Root>
	{/if}
</div>

<!-- USER MODAL -->
<Modal bind:open={userModalOpen} title={userModalMode === 'create' ? 'Add Minechat User' : 'Edit Minechat User'}>
	<form
		method="POST"
		action={userModalMode === 'create' ? '?/userCreate' : '?/userUpdate'}
		use:enhance={() =>
			async ({ result, update }) => {
				if (result.type === 'success') userModalOpen = false;
				await update();
			}}
		class="space-y-3"
	>
		<div>
			<label for="u-uuid" class="mb-1 block text-xs font-medium text-muted-foreground">Minecraft UUID</label>
			<Input.Root id="u-uuid" name="minecraftUuid" bind:value={uUuid} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" required readonly={userModalMode === 'edit'} />
		</div>
		<div>
			<label for="u-mcname" class="mb-1 block text-xs font-medium text-muted-foreground">Minecraft Name</label>
			<Input.Root id="u-mcname" name="minecraftName" bind:value={uMcName} placeholder="Steve" required />
		</div>
		<div>
			<label for="u-dc" class="mb-1 block text-xs font-medium text-muted-foreground">Discord User ID</label>
			<Input.Root id="u-dc" name="discordUserId" bind:value={uDiscordId} placeholder="123456789012345678" required />
		</div>
		<div>
			<label for="u-token" class="mb-1 block text-xs font-medium text-muted-foreground">Token (optional)</label>
			<Input.Root id="u-token" name="token" bind:value={uToken} placeholder="leave blank to clear" />
		</div>
		<div class="flex justify-end gap-2 pt-2">
			<Button.Root type="button" variant="outline" size="sm" onclick={() => (userModalOpen = false)}>Cancel</Button.Root>
			<Button.Root type="submit" size="sm">{userModalMode === 'create' ? 'Create' : 'Save'}</Button.Root>
		</div>
	</form>
</Modal>

<!-- HOOK MODAL -->
<Modal bind:open={hookModalOpen} title={hookModalMode === 'create' ? 'Add Hook' : 'Edit Hook'}>
	<form
		method="POST"
		action={hookModalMode === 'create' ? '?/hookCreate' : '?/hookUpdate'}
		use:enhance={() =>
			async ({ result, update }) => {
				if (result.type === 'success') hookModalOpen = false;
				await update();
			}}
		class="space-y-3"
	>
		<div>
			<label for="h-wid" class="mb-1 block text-xs font-medium text-muted-foreground">Webhook ID</label>
			<Input.Root id="h-wid" name="webhookId" bind:value={hWebhookId} required readonly={hookModalMode === 'edit'} />
		</div>
		<div>
			<label for="h-ch" class="mb-1 block text-xs font-medium text-muted-foreground">Channel ID</label>
			<Input.Root id="h-ch" name="channelId" bind:value={hChannelId} required />
		</div>
		<div>
			<label for="h-tok" class="mb-1 block text-xs font-medium text-muted-foreground">Token</label>
			<Input.Root id="h-tok" name="token" bind:value={hToken} required />
		</div>
		<div>
			<label for="h-srv" class="mb-1 block text-xs font-medium text-muted-foreground">Server</label>
			{#if data.servers.length > 0}
				<select
					id="h-srv"
					name="minecraftServerId"
					bind:value={hServerId}
					class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
					required
				>
					{#each data.servers as s (s.serverId)}
						<option value={s.serverId}>{s.ip} ({s.serverId})</option>
					{/each}
				</select>
			{:else}
				<Input.Root id="h-srv" name="minecraftServerId" bind:value={hServerId} placeholder="server-id" required />
			{/if}
		</div>
		<div>
			<label for="h-pfx" class="mb-1 block text-xs font-medium text-muted-foreground">Prefix</label>
			<Input.Root id="h-pfx" name="prefix" bind:value={hPrefix} placeholder="&lt;%1&gt; " />
		</div>
		<div class="flex justify-end gap-2 pt-2">
			<Button.Root type="button" variant="outline" size="sm" onclick={() => (hookModalOpen = false)}>Cancel</Button.Root>
			<Button.Root type="submit" size="sm">{hookModalMode === 'create' ? 'Create' : 'Save'}</Button.Root>
		</div>
	</form>
</Modal>

<!-- SERVER MODAL -->
<Modal bind:open={serverModalOpen} title={serverModalMode === 'create' ? 'Add Server' : 'Edit Server'}>
	<form
		method="POST"
		action={serverModalMode === 'create' ? '?/serverCreate' : '?/serverUpdate'}
		use:enhance={() =>
			async ({ result, update }) => {
				if (result.type === 'success') serverModalOpen = false;
				await update();
			}}
		class="space-y-3"
	>
		<div>
			<label for="s-id" class="mb-1 block text-xs font-medium text-muted-foreground">Server ID</label>
			<Input.Root id="s-id" name="serverId" bind:value={sId} placeholder="my-server" required readonly={serverModalMode === 'edit'} />
		</div>
		<div>
			<label for="s-ip" class="mb-1 block text-xs font-medium text-muted-foreground">IP</label>
			<Input.Root id="s-ip" name="ip" bind:value={sIp} placeholder="play.example.com" required />
		</div>
		<div class="flex justify-end gap-2 pt-2">
			<Button.Root type="button" variant="outline" size="sm" onclick={() => (serverModalOpen = false)}>Cancel</Button.Root>
			<Button.Root type="submit" size="sm">{serverModalMode === 'create' ? 'Create' : 'Save'}</Button.Root>
		</div>
	</form>
</Modal>
