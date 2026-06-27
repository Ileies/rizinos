<script lang="ts">
	import { enhance } from '$app/forms';
	import { Role } from '$types';
	import { Users, Settings, Pencil, Trash2 } from '@lucide/svelte';
	import * as Table from '$shadcn/table';
	import * as Button from '$shadcn/button';
	import * as Input from '$shadcn/input';
	import Modal from '$lib/components/Modal.svelte';

	let { data } = $props();

	const ROLES = [Role.Admin, Role.Moderator, Role.BetaTester, Role.Developer, Role.Supporter, Role.Trusted, Role.User, Role.Bot];

	const ROLE_CHIP: Record<string, string> = {
		admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
		moderator: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
		developer: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
		supporter: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
		beta: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
		trusted: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
		user: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
		bot: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'
	};

	const GENDER_ICON: Record<string, { symbol: string; cls: string }> = {
		male: { symbol: '♂', cls: 'text-blue-500' },
		female: { symbol: '♀', cls: 'text-pink-500' }
	};

	let editingUserId = $state<string | null>(null);
	let modalOpen = $state(false);
	let pendingRoles = $state<string[]>([]);

	let editingUser = $derived(data.users.find((u) => u.id === editingUserId) ?? null);

	function openEdit(id: string) {
		const user = data.users.find((u) => u.id === id);
		pendingRoles = [...(user?.roles ?? [])];
		editingUserId = id;
		modalOpen = true;
	}

	$effect(() => {
		if (!modalOpen) editingUserId = null;
	});

	function toggleRole(role: string) {
		if (pendingRoles.includes(role)) {
			pendingRoles = pendingRoles.filter((r) => r !== role);
		} else {
			pendingRoles = [...pendingRoles, role];
		}
	}
</script>

<div class="min-h-screen bg-background">
	<div class="border-b">
		<div class="mx-auto max-w-7xl px-6 py-3">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<Users class="h-4 w-4 text-muted-foreground" />
					<h1 class="font-semibold">Admin Dashboard</h1>
					<span class="text-xs text-muted-foreground">({data.users.length})</span>
				</div>
				<Button.Root href="/admin/minecraft" variant="outline" size="sm" class="gap-1.5">
					<Settings class="h-3.5 w-3.5" />
					Minecraft
				</Button.Root>
			</div>
		</div>
	</div>

	<div class="mx-auto max-w-7xl px-6 py-4">
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
								onclick={() => openEdit(user.id)}
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
	</div>
</div>

{#if editingUser}
	<Modal bind:open={modalOpen} title="Edit: {editingUser.username}" wide>
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
							if (result.type === 'success') modalOpen = false;
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
