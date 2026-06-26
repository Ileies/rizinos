<script lang="ts">
	import { enhance } from '$app/forms';
	import { Trash2, Plus, ChevronDown, Settings, Edit2, Check, X } from '@lucide/svelte';
	import * as Card from '$shadcn/card';
	import * as Button from '$shadcn/button';
	import { Badge } from '$shadcn/badge';
	import * as Input from '$shadcn/input';

	let { data } = $props();

	let currentTab = $state('players');
	let expandedPlayers = $state<Record<string, boolean>>({});
	let showWarpForm = $state(false);
	let showWorldForm = $state(false);
	let showGroupForm = $state(false);
	let editingWarp = $state<Record<string, boolean>>({});
	let editingWorld = $state<Record<string, boolean>>({});
	let editingGroup = $state<Record<string, boolean>>({});
	let editingMcUser = $state<Record<string, boolean>>({});

	function togglePlayer(uuid: string) {
		expandedPlayers[uuid] = !expandedPlayers[uuid];
	}

	function toggleWarpEdit(name: string) {
		editingWarp[name] = !editingWarp[name];
	}

	function toggleWorldEdit(name: string) {
		editingWorld[name] = !editingWorld[name];
	}

	function toggleGroupEdit(name: string) {
		editingGroup[name] = !editingGroup[name];
	}

	function toggleMcUserEdit(uuid: string) {
		editingMcUser[uuid] = !editingMcUser[uuid];
	}
</script>

<div class="min-h-screen bg-background">
	<div class="border-b">
		<div class="mx-auto max-w-7xl px-6 py-6">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="rounded-lg bg-primary p-2">
						<Settings class="h-6 w-6 text-primary-foreground" />
					</div>
					<div>
						<h1 class="text-3xl font-bold tracking-tight">Minecraft Management</h1>
						<p class="text-sm text-muted-foreground mt-1">Manage players, warps, worlds and world groups</p>
					</div>
				</div>
				<Button.Root href="/admin">Back to Users</Button.Root>
			</div>
		</div>
	</div>

	<div class="mx-auto max-w-7xl px-6 py-8">
		<div class="border-b mb-8">
			<div class="flex gap-6">
				<button
					class="px-4 py-3 text-sm font-medium transition-colors {currentTab === 'players'
						? 'border-b-2 border-primary text-primary'
						: 'text-muted-foreground hover:text-foreground'}"
					onclick={() => (currentTab = 'players')}
				>
					Players
				</button>
				<button
					class="px-4 py-3 text-sm font-medium transition-colors {currentTab === 'warps'
						? 'border-b-2 border-primary text-primary'
						: 'text-muted-foreground hover:text-foreground'}"
					onclick={() => (currentTab = 'warps')}
				>
					Warps
				</button>
				<button
					class="px-4 py-3 text-sm font-medium transition-colors {currentTab === 'worlds'
						? 'border-b-2 border-primary text-primary'
						: 'text-muted-foreground hover:text-foreground'}"
					onclick={() => (currentTab = 'worlds')}
				>
					Worlds
				</button>
				<button
					class="px-4 py-3 text-sm font-medium transition-colors {currentTab === 'groups'
						? 'border-b-2 border-primary text-primary'
						: 'text-muted-foreground hover:text-foreground'}"
					onclick={() => (currentTab = 'groups')}
				>
					World Groups
				</button>
			</div>
		</div>

		{#if currentTab === 'players'}
			<div class="space-y-4">
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<span>{data.mcUsers.length} Minecraft players linked to accounts</span>
				</div>

				<div class="space-y-3">
					{#each data.mcUsers as mcUser (mcUser.uuid)}
						<Card.Root class="overflow-hidden transition-all hover:shadow-md">
							<div class="flex flex-col">
								<button
									class="flex w-full items-center justify-between px-6 py-4 text-left transition-colors"
									onclick={() => togglePlayer(mcUser.uuid)}
								>
									<div class="flex-1">
										<div class="flex items-center gap-3 mb-2">
											<h3 class="font-semibold text-base">{mcUser.name}</h3>
										</div>
										<p class="text-sm text-muted-foreground">Linked to: {mcUser.user.username}</p>
									</div>
									<ChevronDown
										size={20}
										class="transition-transform {expandedPlayers[mcUser.uuid] ? 'rotate-180' : ''}"
									/>
								</button>

								{#if expandedPlayers[mcUser.uuid]}
									<div class="border-t px-6 py-4 bg-muted/30">
										<div class="space-y-4">
											<div>
												<p class="text-xs font-medium text-muted-foreground uppercase">UUID</p>
												<p class="text-sm font-mono mt-1">{mcUser.uuid.slice(0, 12)}...</p>
											</div>

											<div>
												<p class="text-xs font-medium text-muted-foreground uppercase mb-2">Home Location</p>
												{#if !editingMcUser[mcUser.uuid]}
													<div class="flex items-center justify-between">
														<p class="text-sm">{mcUser.homeLocation || '-'}</p>
														<Button.Root type="button" variant="ghost" size="sm" onclick={() => toggleMcUserEdit(mcUser.uuid)}>
															<Edit2 size={16} />
														</Button.Root>
													</div>
												{:else}
													<form method="POST" action="?/mcUserUpdate" use:enhance class="space-y-2" onsubmit={() => toggleMcUserEdit(mcUser.uuid)}>
														<input type="hidden" name="uuid" value={mcUser.uuid} />
														<Input.Root name="homeLocation" value={mcUser.homeLocation || ''} placeholder="e.g., x:100 y:64 z:200" />
														<Input.Root name="welcomeMessage" value={mcUser.welcomeMessage || ''} placeholder="Welcome message" />
														<div class="flex gap-2">
															<Button.Root type="submit" size="sm">
																<Check size={16} />
																Save
															</Button.Root>
															<Button.Root type="button" variant="ghost" size="sm" onclick={() => toggleMcUserEdit(mcUser.uuid)}>
																<X size={16} />
																Cancel
															</Button.Root>
														</div>
													</form>
												{/if}
											</div>

											{#if mcUser.permissions.length > 0}
												<div>
													<p class="text-xs font-medium text-muted-foreground uppercase">
														Permissions ({mcUser.permissions.length})
													</p>
													<div class="flex flex-wrap gap-1 mt-2">
														{#each mcUser.permissions.slice(0, 10) as perm}
															<Badge variant="secondary">{perm}</Badge>
														{/each}
														{#if mcUser.permissions.length > 10}
															<Badge variant="outline">
																+{mcUser.permissions.length - 10} more
															</Badge>
														{/if}
													</div>
												</div>
											{/if}

											{#if mcUser.bannedUntil}
												<div>
													<p class="text-xs font-medium text-destructive uppercase">Banned Until</p>
													<p class="text-sm mt-1 text-destructive">
														{new Date(mcUser.bannedUntil).toLocaleDateString()}
														{#if mcUser.bannedReason}
															- {mcUser.bannedReason}
														{/if}
													</p>
												</div>
											{/if}

											{#if mcUser.mutedUntil}
												<div>
													<p class="text-xs font-medium text-yellow-600 dark:text-yellow-500 uppercase">Muted Until</p>
													<p class="text-sm mt-1 text-yellow-600 dark:text-yellow-500">
														{new Date(mcUser.mutedUntil).toLocaleDateString()}
													</p>
												</div>
											{/if}


											<div class="border-t pt-4">
												<form method="POST" action="?/mcUserDelete" use:enhance>
													<input type="hidden" name="uuid" value={mcUser.uuid} />
													<Button.Root type="submit" variant="destructive" class="w-full">
														<Trash2 size={16} />
														Delete Account Link
													</Button.Root>
												</form>
											</div>
										</div>
									</div>
								{/if}
							</div>
						</Card.Root>
					{/each}
				</div>
			</div>
		{/if}

		{#if currentTab === 'warps'}
			<div class="space-y-4">
				{#if !showWarpForm}
					<Button.Root onclick={() => (showWarpForm = true)} class="flex items-center gap-2">
						<Plus size={18} />
						Create Warp
					</Button.Root>
				{:else}
					<Card.Root>
						<div class="p-6">
							<h3 class="font-semibold text-lg mb-4">Create New Warp</h3>
							<form method="POST" action="?/warpCreate" use:enhance class="space-y-3">
								<div>
									<Input.Root name="name" placeholder="Warp name" required />
								</div>
								<div>
									<Input.Root
										name="location"
										placeholder="Location (e.g., x:100 y:64 z:200)"
										required
									/>
								</div>
								<div>
									<Input.Root
										name="restrict"
										placeholder="Restrictions (comma-separated, optional)"
									/>
								</div>
								<div class="flex gap-2 pt-2">
									<Button.Root type="submit">Create</Button.Root>
									<Button.Root type="button" variant="ghost" onclick={() => (showWarpForm = false)}>
										Cancel
									</Button.Root>
								</div>
							</form>
						</div>
					</Card.Root>
				{/if}

				<div class="space-y-3">
					{#each data.warps as warp (warp.name)}
						<Card.Root class="overflow-hidden transition-all hover:shadow-md">
							{#if !editingWarp[warp.name]}
								<div class="px-6 py-4 flex items-start justify-between">
									<div>
										<h3 class="font-semibold">{warp.name}</h3>
										<p class="text-sm text-muted-foreground">{warp.location}</p>
										{#if warp.restrict && warp.restrict.length > 0}
											<p class="text-xs text-muted-foreground mt-1">
												Restrictions: {warp.restrict.join(', ')}
											</p>
										{/if}
									</div>
									<div class="flex gap-2">
										<Button.Root type="button" variant="ghost" size="sm" onclick={() => toggleWarpEdit(warp.name)}>
											<Edit2 size={16} />
										</Button.Root>
										<form method="POST" action="?/warpDelete" use:enhance>
											<input type="hidden" name="name" value={warp.name} />
											<Button.Root type="submit" variant="ghost" size="sm" class="text-destructive hover:text-destructive hover:bg-destructive/10">
												<Trash2 size={16} />
											</Button.Root>
										</form>
									</div>
								</div>
							{:else}
								<div class="px-6 py-4">
									<form method="POST" action="?/warpUpdate" use:enhance class="space-y-3" onsubmit={() => toggleWarpEdit(warp.name)}>
										<input type="hidden" name="oldName" value={warp.name} />
										<div>
											<label class="text-xs font-medium text-muted-foreground">Name</label>
											<Input.Root name="name" value={warp.name} required />
										</div>
										<div>
											<label class="text-xs font-medium text-muted-foreground">Location</label>
											<Input.Root name="location" value={warp.location} required />
										</div>
										<div>
											<label class="text-xs font-medium text-muted-foreground">Restrictions (comma-separated)</label>
											<Input.Root name="restrict" value={warp.restrict?.join(', ') || ''} />
										</div>
										<div class="flex gap-2 pt-2">
											<Button.Root type="submit" size="sm">
												<Check size={16} />
												Save
											</Button.Root>
											<Button.Root type="button" variant="ghost" size="sm" onclick={() => toggleWarpEdit(warp.name)}>
												<X size={16} />
												Cancel
											</Button.Root>
										</div>
									</form>
								</div>
							{/if}
						</Card.Root>
					{/each}
				</div>
			</div>
		{/if}

		{#if currentTab === 'worlds'}
			<div class="space-y-4">
				{#if !showWorldForm}
					<Button.Root onclick={() => (showWorldForm = true)} class="flex items-center gap-2">
						<Plus size={18} />
						Create World
					</Button.Root>
				{:else}
					<Card.Root>
						<div class="p-6">
							<h3 class="font-semibold text-lg mb-4">Create New World</h3>
							<form method="POST" action="?/worldCreate" use:enhance class="space-y-3">
								<div>
									<Input.Root name="name" placeholder="World name" required />
								</div>
								<div>
									<select name="groupName" class="w-full px-3 py-2 border rounded-md bg-background" required>
										<option value="">Select a world group</option>
										{#each data.groups as group}
											<option value={group.name}>{group.name}</option>
										{/each}
									</select>
								</div>
								<div>
									<Input.Root
										name="restrict"
										placeholder="Restrictions (comma-separated, optional)"
									/>
								</div>
								<div class="flex gap-2 pt-2">
									<Button.Root type="submit">Create</Button.Root>
									<Button.Root type="button" variant="ghost" onclick={() => (showWorldForm = false)}>
										Cancel
									</Button.Root>
								</div>
							</form>
						</div>
					</Card.Root>
				{/if}

				<div class="space-y-3">
					{#each data.worlds as world (world.name)}
						<Card.Root class="overflow-hidden transition-all hover:shadow-md">
							{#if !editingWorld[world.name]}
								<div class="px-6 py-4 flex items-start justify-between">
									<div>
										<h3 class="font-semibold">{world.name}</h3>
										<p class="text-sm text-muted-foreground">Group: {world.groupName}</p>
										{#if world.restrict && world.restrict.length > 0}
											<p class="text-xs text-muted-foreground mt-1">
												Restrictions: {world.restrict.join(', ')}
											</p>
										{/if}
									</div>
									<div class="flex gap-2">
										<Button.Root type="button" variant="ghost" size="sm" onclick={() => toggleWorldEdit(world.name)}>
											<Edit2 size={16} />
										</Button.Root>
										<form method="POST" action="?/worldDelete" use:enhance>
											<input type="hidden" name="name" value={world.name} />
											<Button.Root type="submit" variant="ghost" size="sm" class="text-destructive hover:text-destructive hover:bg-destructive/10">
												<Trash2 size={16} />
											</Button.Root>
										</form>
									</div>
								</div>
							{:else}
								<div class="px-6 py-4">
									<form method="POST" action="?/worldUpdate" use:enhance class="space-y-3" onsubmit={() => toggleWorldEdit(world.name)}>
										<input type="hidden" name="oldName" value={world.name} />
										<div>
											<label class="text-xs font-medium text-muted-foreground">Name</label>
											<Input.Root name="name" value={world.name} required />
										</div>
										<div>
											<label class="text-xs font-medium text-muted-foreground">World Group</label>
											<select name="groupName" class="w-full px-3 py-2 border rounded-md bg-background" required>
												{#each data.groups as group}
													<option value={group.name} selected={group.name === world.groupName}>{group.name}</option>
												{/each}
											</select>
										</div>
										<div>
											<label class="text-xs font-medium text-muted-foreground">Restrictions (comma-separated)</label>
											<Input.Root name="restrict" value={world.restrict?.join(', ') || ''} />
										</div>
										<div class="flex gap-2 pt-2">
											<Button.Root type="submit" size="sm">
												<Check size={16} />
												Save
											</Button.Root>
											<Button.Root type="button" variant="ghost" size="sm" onclick={() => toggleWorldEdit(world.name)}>
												<X size={16} />
												Cancel
											</Button.Root>
										</div>
									</form>
								</div>
							{/if}
						</Card.Root>
					{/each}
				</div>
			</div>
		{/if}

		{#if currentTab === 'groups'}
			<div class="space-y-4">
				{#if !showGroupForm}
					<Button.Root onclick={() => (showGroupForm = true)} class="flex items-center gap-2">
						<Plus size={18} />
						Create Group
					</Button.Root>
				{:else}
					<Card.Root>
						<div class="p-6">
							<h3 class="font-semibold text-lg mb-4">Create New World Group</h3>
							<form method="POST" action="?/groupCreate" use:enhance class="space-y-3">
								<div>
									<Input.Root name="name" placeholder="Group name" required />
								</div>
								<div>
									<select name="gameMode" class="w-full px-3 py-2 border rounded-md bg-background">
										<option value="0">Survival (0)</option>
										<option value="1">Creative (1)</option>
										<option value="2">Adventure (2)</option>
										<option value="3">Spectator (3)</option>
									</select>
								</div>
								<div>
									<Input.Root
										name="restrict"
										placeholder="Restrictions (comma-separated, optional)"
									/>
								</div>
								<div class="flex gap-2 pt-2">
									<Button.Root type="submit">Create</Button.Root>
									<Button.Root type="button" variant="ghost" onclick={() => (showGroupForm = false)}>
										Cancel
									</Button.Root>
								</div>
							</form>
						</div>
					</Card.Root>
				{/if}

				<div class="space-y-3">
					{#each data.groups as group (group.name)}
						<Card.Root class="overflow-hidden transition-all hover:shadow-md">
							{#if !editingGroup[group.name]}
								<div class="px-6 py-4 flex items-start justify-between">
									<div>
										<h3 class="font-semibold">{group.name}</h3>
										<p class="text-sm text-muted-foreground">
											Game Mode: {['Survival', 'Creative', 'Adventure', 'Spectator'][group.gameMode]}
										</p>
										{#if group.restrict && group.restrict.length > 0}
											<p class="text-xs text-muted-foreground mt-1">
												Restrictions: {group.restrict.join(', ')}
											</p>
										{/if}
									</div>
									<div class="flex gap-2">
										<Button.Root type="button" variant="ghost" size="sm" onclick={() => toggleGroupEdit(group.name)}>
											<Edit2 size={16} />
										</Button.Root>
										<form method="POST" action="?/groupDelete" use:enhance>
											<input type="hidden" name="name" value={group.name} />
											<Button.Root type="submit" variant="ghost" size="sm" class="text-destructive hover:text-destructive hover:bg-destructive/10">
												<Trash2 size={16} />
											</Button.Root>
										</form>
									</div>
								</div>
							{:else}
								<div class="px-6 py-4">
									<form method="POST" action="?/groupUpdate" use:enhance class="space-y-3" onsubmit={() => toggleGroupEdit(group.name)}>
										<input type="hidden" name="oldName" value={group.name} />
										<div>
											<label class="text-xs font-medium text-muted-foreground">Name</label>
											<Input.Root name="name" value={group.name} required />
										</div>
										<div>
											<label class="text-xs font-medium text-muted-foreground">Game Mode</label>
											<select name="gameMode" class="w-full px-3 py-2 border rounded-md bg-background" required>
												<option value="0" selected={group.gameMode === 0}>Survival (0)</option>
												<option value="1" selected={group.gameMode === 1}>Creative (1)</option>
												<option value="2" selected={group.gameMode === 2}>Adventure (2)</option>
												<option value="3" selected={group.gameMode === 3}>Spectator (3)</option>
											</select>
										</div>
										<div>
											<label class="text-xs font-medium text-muted-foreground">Restrictions (comma-separated)</label>
											<Input.Root name="restrict" value={group.restrict?.join(', ') || ''} />
										</div>
										<div class="flex gap-2 pt-2">
											<Button.Root type="submit" size="sm">
												<Check size={16} />
												Save
											</Button.Root>
											<Button.Root type="button" variant="ghost" size="sm" onclick={() => toggleGroupEdit(group.name)}>
												<X size={16} />
												Cancel
											</Button.Root>
										</div>
									</form>
								</div>
							{/if}
						</Card.Root>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>
