<script lang="ts">
	import { enhance } from '$app/forms';
	import { Trash2, Plus, ChevronDown, Settings } from '@lucide/svelte';
	import * as Card from '$shadcn/card';
	import * as Button from '$shadcn/button';
	import { Badge } from '$shadcn/badge';
	import * as Input from '$shadcn/input';
	import InlineEdit from '$lib/components/InlineEdit.svelte';
	import LocationInput from '$lib/components/LocationInput.svelte';

	let { data } = $props();

	let currentTab = $state('players');
	let expandedPlayers = $state<Record<string, boolean>>({});
	let showWarpForm = $state(false);
	let showWorldForm = $state(false);
	let showGroupForm = $state(false);

	function togglePlayer(uuid: string) {
		expandedPlayers[uuid] = !expandedPlayers[uuid];
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
				{#each ['players', 'warps', 'worlds', 'groups'] as tab}
					<button
						class="px-4 py-3 text-sm font-medium transition-colors {currentTab === tab
							? 'border-b-2 border-primary text-primary'
							: 'text-muted-foreground hover:text-foreground'}"
						onclick={() => (currentTab = tab)}
					>
						{tab.charAt(0).toUpperCase() + tab.slice(1)}
					</button>
				{/each}
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

											<LocationInput
												location={mcUser.homeLocation}
												label="Home Location"
												action="?/mcUserUpdate"
												hiddenFields={{ uuid: mcUser.uuid, welcomeMessage: mcUser.welcomeMessage || '' }}
											/>

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
								<Input.Root name="name" placeholder="Warp name" required />
								<Input.Root name="location" placeholder="Location (e.g., x:100 y:64 z:200)" required />
								<Input.Root name="restrict" placeholder="Restrictions (comma-separated, optional)" />
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
							<div class="p-6 space-y-4">
								<div class="flex items-start justify-between mb-4">
									<div>
										<h3 class="font-semibold">{warp.name}</h3>
									</div>
									<form method="POST" action="?/warpDelete" use:enhance>
										<input type="hidden" name="name" value={warp.name} />
										<Button.Root type="submit" variant="ghost" size="sm" class="text-destructive hover:text-destructive hover:bg-destructive/10">
											<Trash2 size={16} />
										</Button.Root>
									</form>
								</div>

								<InlineEdit
									value={warp.name}
									label="Name"
									action="?/warpUpdate"
									hiddenFields={{ oldName: warp.name, location: warp.location, restrict: warp.restrict?.join(', ') || '' }}
									type="text"
								/>

								<LocationInput
									location={warp.location}
									action="?/warpUpdate"
									hiddenFields={{ oldName: warp.name, name: warp.name, restrict: warp.restrict?.join(', ') || '' }}
								/>

								<InlineEdit
									value={warp.restrict?.join(', ') || ''}
									label="Restrictions"
									action="?/warpUpdate"
									hiddenFields={{ oldName: warp.name, name: warp.name, location: warp.location }}
									type="text"
								/>
							</div>
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
								<Input.Root name="name" placeholder="World name" required />
								<select name="groupName" class="w-full px-3 py-2 border rounded-md bg-background" required>
									<option value="">Select a world group</option>
									{#each data.groups as group}
										<option value={group.name}>{group.name}</option>
									{/each}
								</select>
								<Input.Root name="restrict" placeholder="Restrictions (comma-separated, optional)" />
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
							<div class="p-6 space-y-4">
								<div class="flex items-start justify-between mb-4">
									<div>
										<h3 class="font-semibold">{world.name}</h3>
									</div>
									<form method="POST" action="?/worldDelete" use:enhance>
										<input type="hidden" name="name" value={world.name} />
										<Button.Root type="submit" variant="ghost" size="sm" class="text-destructive hover:text-destructive hover:bg-destructive/10">
											<Trash2 size={16} />
										</Button.Root>
									</form>
								</div>

								<InlineEdit
									value={world.name}
									label="Name"
									action="?/worldUpdate"
									hiddenFields={{ oldName: world.name, groupName: world.groupName, restrict: world.restrict?.join(', ') || '' }}
								/>

								<InlineEdit
									value={world.groupName}
									label="World Group"
									action="?/worldUpdate"
									hiddenFields={{ oldName: world.name, name: world.name, restrict: world.restrict?.join(', ') || '' }}
									type="select"
									selectOptions={data.groups.map(g => ({ value: g.name, label: g.name }))}
								/>

								<InlineEdit
									value={world.restrict?.join(', ') || ''}
									label="Restrictions"
									action="?/worldUpdate"
									hiddenFields={{ oldName: world.name, name: world.name, groupName: world.groupName }}
								/>
							</div>
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
								<Input.Root name="name" placeholder="Group name" required />
								<select name="gameMode" class="w-full px-3 py-2 border rounded-md bg-background">
									<option value="0">Survival (0)</option>
									<option value="1">Creative (1)</option>
									<option value="2">Adventure (2)</option>
									<option value="3">Spectator (3)</option>
								</select>
								<Input.Root name="restrict" placeholder="Restrictions (comma-separated, optional)" />
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
							<div class="p-6 space-y-4">
								<div class="flex items-start justify-between mb-4">
									<div>
										<h3 class="font-semibold">{group.name}</h3>
									</div>
									<form method="POST" action="?/groupDelete" use:enhance>
										<input type="hidden" name="name" value={group.name} />
										<Button.Root type="submit" variant="ghost" size="sm" class="text-destructive hover:text-destructive hover:bg-destructive/10">
											<Trash2 size={16} />
										</Button.Root>
									</form>
								</div>

								<InlineEdit
									value={group.name}
									label="Name"
									action="?/groupUpdate"
									hiddenFields={{ oldName: group.name, gameMode: group.gameMode.toString(), restrict: group.restrict?.join(', ') || '' }}
								/>

								<InlineEdit
									value={group.gameMode}
									label="Game Mode"
									action="?/groupUpdate"
									hiddenFields={{ oldName: group.name, name: group.name, restrict: group.restrict?.join(', ') || '' }}
									type="select"
									selectOptions={[
										{ value: '0', label: 'Survival (0)' },
										{ value: '1', label: 'Creative (1)' },
										{ value: '2', label: 'Adventure (2)' },
										{ value: '3', label: 'Spectator (3)' }
									]}
								/>

								<InlineEdit
									value={group.restrict?.join(', ') || ''}
									label="Restrictions"
									action="?/groupUpdate"
									hiddenFields={{ oldName: group.name, name: group.name, gameMode: group.gameMode.toString() }}
								/>
							</div>
						</Card.Root>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>
