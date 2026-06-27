<script lang="ts">
	import { enhance } from '$app/forms';
	import { Role } from '$types';
	import { Users, ScrollText, LayoutGrid, Pencil, Trash2, Plus, X } from '@lucide/svelte';
	import * as Table from '$shadcn/table';
	import * as Button from '$shadcn/button';
	import * as Input from '$shadcn/input';
	import Modal from '$lib/components/Modal.svelte';
	import RestrictEditor from '$lib/components/RestrictEditor.svelte';

	let { data } = $props();

	let currentTab = $state('users');

	const ROLES = [Role.Admin, Role.Moderator, Role.BetaTester, Role.Developer, Role.Supporter, Role.Trusted, Role.User, Role.Bot];

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

	const LOG_CHIP: Record<string, string> = {
		info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
		warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500',
		error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
		debug: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
	};

	const GENDER_ICON: Record<string, { symbol: string; cls: string }> = {
		male: { symbol: '♂', cls: 'text-blue-500' },
		female: { symbol: '♀', cls: 'text-pink-500' }
	};

	const innerTabs = [
		{ id: 'users', label: 'Users', icon: Users, count: () => data.users.length },
		{ id: 'logs', label: 'Logs', icon: ScrollText, count: () => data.logs.length },
		{ id: 'apps', label: 'Apps', icon: LayoutGrid, count: () => data.apps.length }
	];

	// --- Users ---
	let editingUserId = $state<string | null>(null);
	let userModalOpen = $state(false);
	let pendingRoles = $state<string[]>([]);
	let editingUser = $derived(data.users.find((u) => u.id === editingUserId) ?? null);

	function openUserEdit(id: string) {
		const user = data.users.find((u) => u.id === id);
		pendingRoles = [...(user?.roles ?? [])];
		editingUserId = id;
		userModalOpen = true;
	}

	$effect(() => {
		if (!userModalOpen) editingUserId = null;
	});

	function toggleRole(role: string) {
		if (pendingRoles.includes(role)) {
			pendingRoles = pendingRoles.filter((r) => r !== role);
		} else {
			pendingRoles = [...pendingRoles, role];
		}
	}

	// --- Logs ---
	let logModalOpen = $state(false);
	let selectedLog = $state<(typeof data.logs)[0] | null>(null);

	function openLog(log: (typeof data.logs)[0]) {
		selectedLog = log;
		logModalOpen = true;
	}

	// --- Create User ---
	let createUserOpen = $state(false);

	// --- Apps ---
	type AppEntry = (typeof data.apps)[0];

	let appModalOpen = $state(false);
	let appModalMode = $state<'create' | 'edit'>('create');
	let editingApp = $state<AppEntry | null>(null);
	let appName = $state('');
	let appTitle = $state('');
	let appAuthorId = $state('');
	let appRestrict = $state<string[]>([]);

	function openAppCreate() {
		appModalMode = 'create';
		editingApp = null;
		appName = '';
		appTitle = '';
		appAuthorId = data.users[0]?.id ?? '';
		appRestrict = [];
		appModalOpen = true;
	}

	function openAppEdit(app: AppEntry) {
		appModalMode = 'edit';
		editingApp = app;
		appName = app.name;
		appTitle = app.title;
		appAuthorId = app.authorId;
		appRestrict = app.restrict ?? [];
		appModalOpen = true;
	}

	$effect(() => {
		if (!appModalOpen) editingApp = null;
	});
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
			<Button.Root size="sm" onclick={() => (createUserOpen = true)}>
				<Plus size={14} />
				New User
			</Button.Root>
		</div>
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="w-36">Username</Table.Head>
					<Table.Head>Email</Table.Head>
					<Table.Head>Roles</Table.Head>
					<Table.Head class="w-8 text-center" title="Gender">G</Table.Head>
					<Table.Head class="w-20 text-right">Credit</Table.Head>
					<Table.Head class="w-28">Last Online</Table.Head>
					<Table.Head class="w-10"></Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.users as user (user.id)}
					<Table.Row class="hover:bg-muted/40 group">
						<Table.Cell class="py-1.5">
							<div class="font-medium">{user.username}</div>
							<div class="text-xs text-muted-foreground">{user.firstName} {user.lastName}</div>
						</Table.Cell>
						<Table.Cell class="py-1.5 text-xs text-muted-foreground">{user.email}</Table.Cell>
						<Table.Cell class="py-1.5">
							<div class="flex flex-wrap gap-1">
								{#each user.roles as role}
									<span class="rounded px-1.5 py-0.5 text-xs font-medium {ROLE_CHIP[role] ?? 'bg-gray-100 text-gray-600'}">{role}</span>
								{/each}
							</div>
						</Table.Cell>
						<Table.Cell class="py-1.5 text-center">
							{#if user.gender && GENDER_ICON[user.gender]}
								<span class="text-sm font-bold {GENDER_ICON[user.gender].cls}">{GENDER_ICON[user.gender].symbol}</span>
							{:else}
								<span class="text-muted-foreground">-</span>
							{/if}
						</Table.Cell>
						<Table.Cell class="py-1.5 text-right tabular-nums text-sm">{user.credit}</Table.Cell>
						<Table.Cell class="py-1.5 text-xs text-muted-foreground">
							{new Date(user.lastOnline).toLocaleDateString('en', { month: 'short', day: 'numeric', year: '2-digit' })}
						</Table.Cell>
						<Table.Cell class="py-1.5">
							<button
								onclick={() => openUserEdit(user.id)}
								class="rounded p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-muted hover:text-foreground group-hover:opacity-100"
								title="Edit"
							>
								<Pencil size={13} />
							</button>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	{/if}

	<!-- LOGS -->
	{#if currentTab === 'logs'}
		<div class="overflow-auto rounded-md border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-20">Level</Table.Head>
						<Table.Head class="w-80">Message</Table.Head>
						<Table.Head class="w-36">Timestamp</Table.Head>
						<Table.Head>Data</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.logs as log (log.id)}
						<Table.Row
							class="hover:bg-muted/40 cursor-pointer"
							onclick={() => openLog(log)}
						>
							<Table.Cell class="py-1.5">
								<span class="rounded px-1.5 py-0.5 text-xs font-medium {LOG_CHIP[log.type] ?? 'bg-gray-100 text-gray-600'}">{log.type}</span>
							</Table.Cell>
							<Table.Cell class="py-1.5 text-sm max-w-[20rem] truncate">{log.message}</Table.Cell>
							<Table.Cell class="py-1.5 text-xs text-muted-foreground tabular-nums">
								{new Date(log.createdAt).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
							</Table.Cell>
							<Table.Cell class="py-1.5">
								{#if log.data}
									<span class="block truncate font-mono text-xs text-muted-foreground">
										{JSON.stringify(log.data)}
									</span>
								{:else}
									<span class="text-xs text-muted-foreground/40">-</span>
								{/if}
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
		{#if data.logs.length === 500}
			<p class="mt-2 text-xs text-muted-foreground">Showing 500 most recent entries.</p>
		{/if}
	{/if}

	<!-- APPS -->
	{#if currentTab === 'apps'}
		<div class="mb-3">
			<Button.Root size="sm" onclick={openAppCreate}>
				<Plus size={14} />
				Add App
			</Button.Root>
		</div>
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="w-48">Name</Table.Head>
					<Table.Head>Title</Table.Head>
					<Table.Head class="w-28">Author</Table.Head>
					<Table.Head>Restrictions</Table.Head>
					<Table.Head class="w-16"></Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.apps as app (app.id)}
					<Table.Row class="hover:bg-muted/40 group">
						<Table.Cell class="py-1.5 font-mono text-sm">{app.name}</Table.Cell>
						<Table.Cell class="py-1.5 font-medium">{app.title}</Table.Cell>
						<Table.Cell class="py-1.5">
							{#if app.user}
								<button onclick={() => openUserEdit(app.authorId)} class="text-sm text-muted-foreground hover:text-foreground hover:underline">
									{app.user.username}
								</button>
							{:else}
								<span class="text-sm text-muted-foreground">-</span>
							{/if}
						</Table.Cell>
						<Table.Cell class="overflow-hidden py-1.5">
							<RestrictEditor value={app.restrict ?? []} readonly users={data.users} onUserClick={(id) => openUserEdit(id)} />
						</Table.Cell>
						<Table.Cell class="py-1.5">
							<div class="flex items-center gap-1 opacity-0 transition-all group-hover:opacity-100">
								<button
									onclick={() => openAppEdit(app)}
									class="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
									title="Edit"
								>
									<Pencil size={13} />
								</button>
								<form method="POST" action="?/appDelete" use:enhance>
									<input type="hidden" name="appId" value={app.id} />
									<button
										type="submit"
										class="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
										title="Delete"
									>
										<Trash2 size={13} />
									</button>
								</form>
							</div>
						</Table.Cell>
					</Table.Row>
				{/each}
				{#if data.apps.length === 0}
					<Table.Row>
						<Table.Cell colspan={5} class="py-8 text-center text-sm text-muted-foreground">No apps</Table.Cell>
					</Table.Row>
				{/if}
			</Table.Body>
		</Table.Root>
	{/if}
</div>

<!-- USER EDIT MODAL -->
{#if editingUser}
	<Modal bind:open={userModalOpen} title="Edit: {editingUser.username}" wide>
		<div class="space-y-5">
			<!-- Profile -->
			<form method="POST" action="?/userUpdateProfile" use:enhance class="space-y-3">
				<input type="hidden" name="userId" value={editingUser.id} />
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="edit-username" class="mb-1 block text-xs font-medium text-muted-foreground">Username</label>
						<Input.Root id="edit-username" name="username" value={editingUser.username} required />
					</div>
					<div>
						<label for="edit-email" class="mb-1 block text-xs font-medium text-muted-foreground">Email</label>
						<Input.Root id="edit-email" name="email" type="email" value={editingUser.email} required />
					</div>
					<div>
						<label for="edit-credit" class="mb-1 block text-xs font-medium text-muted-foreground">Credit</label>
						<Input.Root id="edit-credit" name="credit" type="number" value={editingUser.credit} min="0" required />
					</div>
					<div>
						<label for="edit-gender" class="mb-1 block text-xs font-medium text-muted-foreground">Gender</label>
						<select
							id="edit-gender"
							name="gender"
							class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
						>
							<option value="" selected={!editingUser.gender}>-</option>
							<option value="male" selected={editingUser.gender === 'male'}>♂ Male</option>
							<option value="female" selected={editingUser.gender === 'female'}>♀ Female</option>
						</select>
					</div>
				</div>
				<Button.Root type="submit" size="sm">Save Profile</Button.Root>
			</form>

			<!-- Password -->
			<div class="border-t pt-4">
				<form method="POST" action="?/userUpdatePassword" use:enhance class="space-y-2">
					<input type="hidden" name="userId" value={editingUser.id} />
					<label for="edit-password" class="block text-xs font-medium text-muted-foreground">Reset Password</label>
					<div class="flex gap-2">
						<Input.Root id="edit-password" name="newPassword" type="text" placeholder="New password" class="flex-1" />
						<Button.Root type="submit" size="sm" variant="outline">Set</Button.Root>
					</div>
				</form>
			</div>

			<!-- Roles -->
			<div class="border-t pt-4">
				<p class="mb-2 text-xs font-medium text-muted-foreground">Roles</p>
				<div class="mb-3 flex flex-wrap gap-1.5">
					{#each ROLES as role}
						<button
							type="button"
							onclick={() => toggleRole(role)}
							class="rounded px-2 py-0.5 text-xs font-medium transition-all {pendingRoles.includes(role)
								? (ROLE_CHIP[role] ?? 'bg-gray-100 text-gray-600')
								: 'border border-dashed text-muted-foreground hover:border-foreground hover:text-foreground'}"
						>{role}</button>
					{/each}
				</div>
				<form method="POST" action="?/userSetRoles" use:enhance>
					<input type="hidden" name="userId" value={editingUser.id} />
					<input type="hidden" name="roles" value={pendingRoles.join(',')} />
					<Button.Root type="submit" size="sm">Save Roles</Button.Root>
				</form>
			</div>

			<!-- Meta -->
			<div class="border-t pt-3 text-xs text-muted-foreground">
				<p>ID: <span class="font-mono">{editingUser.id}</span></p>
				<p class="mt-0.5">Last online: {new Date(editingUser.lastOnline).toLocaleString()}</p>
			</div>

			<!-- Delete -->
			<div class="border-t pt-4">
				<form
					method="POST"
					action="?/userDelete"
					use:enhance={() =>
						async ({ result, update }) => {
							if (result.type === 'success') userModalOpen = false;
							await update();
						}}
				>
					<input type="hidden" name="userId" value={editingUser.id} />
					<Button.Root type="submit" variant="destructive" size="sm" class="w-full">
						<Trash2 size={14} />
						Delete User
					</Button.Root>
				</form>
			</div>
		</div>
	</Modal>
{/if}

<!-- LOG DETAIL MODAL -->
{#if selectedLog}
	<Modal bind:open={logModalOpen} title="Log Entry" wide>
		<div class="space-y-3">
			<div class="flex items-center gap-2">
				<span class="rounded px-1.5 py-0.5 text-xs font-medium {LOG_CHIP[selectedLog.type] ?? 'bg-gray-100 text-gray-600'}">{selectedLog.type}</span>
				<span class="text-xs text-muted-foreground tabular-nums">
					{new Date(selectedLog.createdAt).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'medium' })}
				</span>
			</div>
			<div>
				<p class="mb-1 text-xs font-medium text-muted-foreground">Message</p>
				<p class="text-sm">{selectedLog.message}</p>
			</div>
			{#if selectedLog.data}
				<div>
					<p class="mb-1 text-xs font-medium text-muted-foreground">Data</p>
					<pre class="overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(selectedLog.data, null, 2)}</pre>
				</div>
			{/if}
			<div class="pt-1 text-xs text-muted-foreground">
				ID: <span class="font-mono">{selectedLog.id}</span>
			</div>
		</div>
	</Modal>
{/if}

<!-- APP MODAL -->
<Modal bind:open={appModalOpen} title={appModalMode === 'create' ? 'Add App' : 'Edit App'}>
	<form
		method="POST"
		action={appModalMode === 'create' ? '?/appCreate' : '?/appUpdate'}
		use:enhance={() =>
			async ({ result, update }) => {
				if (result.type === 'success') appModalOpen = false;
				await update();
			}}
		class="space-y-3"
	>
		{#if appModalMode === 'edit' && editingApp}
			<input type="hidden" name="appId" value={editingApp.id} />
		{/if}
		<div>
			<label for="app-name" class="mb-1 block text-xs font-medium text-muted-foreground">Name (slug)</label>
			<Input.Root id="app-name" name="name" bind:value={appName} placeholder="my-app" required />
		</div>
		<div>
			<label for="app-title" class="mb-1 block text-xs font-medium text-muted-foreground">Title</label>
			<Input.Root id="app-title" name="title" bind:value={appTitle} placeholder="My App" required />
		</div>
		<div>
			<label for="app-author" class="mb-1 block text-xs font-medium text-muted-foreground">Author</label>
			<select
				id="app-author"
				name="authorId"
				bind:value={appAuthorId}
				class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
				required
			>
				{#each data.users as u (u.id)}
					<option value={u.id}>{u.username}</option>
				{/each}
			</select>
		</div>
		<div>
			<p class="mb-1 text-xs font-medium text-muted-foreground">Restrictions</p>
			{#key editingApp?.id ?? 'create'}
				<RestrictEditor name="restrict" value={appRestrict} users={data.users} />
			{/key}
		</div>
		<div class="flex justify-end gap-2 pt-2">
			<Button.Root type="button" variant="outline" size="sm" onclick={() => (appModalOpen = false)}>Cancel</Button.Root>
			<Button.Root type="submit" size="sm">{appModalMode === 'create' ? 'Create' : 'Save'}</Button.Root>
		</div>
	</form>
</Modal>

<!-- CREATE USER MODAL -->
<Modal bind:open={createUserOpen} title="New User" wide>
	<form
		method="POST"
		action="?/userCreate"
		use:enhance={() =>
			async ({ result, update }) => {
				if (result.type === 'success') createUserOpen = false;
				await update();
			}}
		class="space-y-3"
	>
		<div class="grid grid-cols-2 gap-3">
			<div>
				<label for="new-username" class="mb-1 block text-xs font-medium text-muted-foreground">Username</label>
				<Input.Root id="new-username" name="username" placeholder="johndoe" required />
			</div>
			<div>
				<label for="new-email" class="mb-1 block text-xs font-medium text-muted-foreground">Email</label>
				<Input.Root id="new-email" name="email" type="email" placeholder="john@example.com" required />
			</div>
			<div>
				<label for="new-firstname" class="mb-1 block text-xs font-medium text-muted-foreground">First Name</label>
				<Input.Root id="new-firstname" name="firstName" placeholder="John" required />
			</div>
			<div>
				<label for="new-lastname" class="mb-1 block text-xs font-medium text-muted-foreground">Last Name</label>
				<Input.Root id="new-lastname" name="lastName" placeholder="Doe" required />
			</div>
			<div>
				<label for="new-password" class="mb-1 block text-xs font-medium text-muted-foreground">Password</label>
				<Input.Root id="new-password" name="password" type="text" placeholder="Initial password" required />
			</div>
			<div>
				<label for="new-birthdate" class="mb-1 block text-xs font-medium text-muted-foreground">Birthdate</label>
				<Input.Root id="new-birthdate" name="birthdate" type="date" required />
			</div>
			<div>
				<label for="new-gender" class="mb-1 block text-xs font-medium text-muted-foreground">Gender</label>
				<select id="new-gender" name="gender" class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" required>
					<option value="male">♂ Male</option>
					<option value="female">♀ Female</option>
				</select>
			</div>
		</div>
		<div class="flex justify-end gap-2 pt-2">
			<Button.Root type="button" variant="outline" size="sm" onclick={() => (createUserOpen = false)}>Cancel</Button.Root>
			<Button.Root type="submit" size="sm">Create</Button.Root>
		</div>
	</form>
</Modal>
