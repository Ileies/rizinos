<script lang="ts">
	import { enhance } from '$app/forms';
	import { Trash2, Plus, ChevronDown } from '@lucide/svelte';

	let {
		data
	} = $props();

	let currentTab = $state('players');
	let expandedPlayers = $state<Record<string, boolean>>({});
	let showWarpForm = $state(false);
	let showWorldForm = $state(false);
	let showGroupForm = $state(false);

	function togglePlayer(uuid: string) {
		expandedPlayers[uuid] = !expandedPlayers[uuid];
	}
</script>

<div class="min-h-screen bg-base-200 p-4">
	<div class="mx-auto max-w-6xl">
		<div class="mb-8 flex items-center justify-between">
			<h1 class="text-3xl font-bold">Minecraft Management</h1>
			<a href="/admin" class="btn btn-outline">
				Back to Users
			</a>
		</div>

		<div class="tabs mb-6 border-b border-base-300">
			<button
				class="tab {currentTab === 'players' ? 'tab-active' : ''}"
				onclick={() => (currentTab = 'players')}
			>
				Players
			</button>
			<button
				class="tab {currentTab === 'warps' ? 'tab-active' : ''}"
				onclick={() => (currentTab = 'warps')}
			>
				Warps
			</button>
			<button
				class="tab {currentTab === 'worlds' ? 'tab-active' : ''}"
				onclick={() => (currentTab = 'worlds')}
			>
				Worlds
			</button>
			<button
				class="tab {currentTab === 'groups' ? 'tab-active' : ''}"
				onclick={() => (currentTab = 'groups')}
			>
				World Groups
			</button>
		</div>

		<!-- PLAYERS TAB -->
		{#if currentTab === 'players'}
			<div class="space-y-4">
				<p class="text-sm text-base-content/60">
					{data.mcUsers.length} Minecraft players linked to accounts
				</p>
				{#each data.mcUsers as mcUser (mcUser.uuid)}
					<div class="card bg-base-100 shadow-sm">
						<div class="card-body p-4">
							<button
								class="flex w-full items-center justify-between text-left"
								onclick={() => togglePlayer(mcUser.uuid)}
							>
								<div>
									<h3 class="font-semibold">{mcUser.name}</h3>
									<p class="text-sm text-base-content/60">
										Linked to: {mcUser.user.username}
									</p>
								</div>
								<ChevronDown size={20} class={expandedPlayers[mcUser.uuid] ? 'rotate-180' : ''} />
							</button>

							{#if expandedPlayers[mcUser.uuid]}
								<div class="mt-4 space-y-2 border-t pt-4 text-sm">
									<p class="font-mono text-xs text-base-content/60">
										UUID: {mcUser.uuid}
									</p>
									{#if mcUser.homeLocation}
										<p>
											<span class="font-semibold">Home:</span>
											{mcUser.homeLocation}
										</p>
									{/if}
									{#if mcUser.permissions.length > 0}
										<p>
											<span class="font-semibold">Permissions ({mcUser.permissions.length}):</span>
										</p>
										<div class="flex flex-wrap gap-1">
											{#each mcUser.permissions.slice(0, 10) as perm}
												<span class="badge badge-sm">{perm}</span>
											{/each}
											{#if mcUser.permissions.length > 10}
												<span class="badge badge-sm badge-outline">
													+{mcUser.permissions.length - 10} more
												</span>
											{/if}
										</div>
									{/if}
									{#if mcUser.bannedUntil}
										<p class="text-error">
											<span class="font-semibold">Banned until:</span>
											{new Date(mcUser.bannedUntil).toLocaleDateString()}
											{#if mcUser.bannedReason}
												- {mcUser.bannedReason}
											{/if}
										</p>
									{/if}
									{#if mcUser.mutedUntil}
										<p class="text-warning">
											<span class="font-semibold">Muted until:</span>
											{new Date(mcUser.mutedUntil).toLocaleDateString()}
										</p>
									{/if}
									{#if mcUser.welcomeMessage}
										<p>
											<span class="font-semibold">Welcome Message:</span>
											{mcUser.welcomeMessage}
										</p>
									{/if}

									<form method="POST" action="?/mcUserDelete" use:enhance class="mt-3">
										<input type="hidden" name="uuid" value={mcUser.uuid} />
										<button class="btn btn-sm btn-error w-full">
											<Trash2 size={16} />
											Delete Account Link
										</button>
									</form>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- WARPS TAB -->
		{#if currentTab === 'warps'}
			<div class="space-y-4">
				{#if !showWarpForm}
					<button
						class="btn btn-primary"
						onclick={() => (showWarpForm = true)}
					>
						<Plus size={18} />
						Create Warp
					</button>
				{:else}
					<form method="POST" action="?/warpCreate" use:enhance class="card bg-base-100">
						<div class="card-body space-y-3">
							<h3 class="card-title text-lg">Create New Warp</h3>
							<input
								type="text"
								name="name"
								placeholder="Warp name"
								class="input input-bordered"
								required
							/>
							<input
								type="text"
								name="location"
								placeholder="Location (e.g., x:100 y:64 z:200)"
								class="input input-bordered"
								required
							/>
							<input
								type="text"
								name="restrict"
								placeholder="Restrictions (comma-separated, optional)"
								class="input input-bordered"
							/>
							<div class="flex gap-2">
								<button type="submit" class="btn btn-primary">Create</button>
								<button
									type="button"
									class="btn btn-ghost"
									onclick={() => (showWarpForm = false)}
								>
									Cancel
								</button>
							</div>
						</div>
					</form>
				{/if}

				<div class="space-y-2">
					{#each data.warps as warp (warp.name)}
						<div class="card bg-base-100 shadow-sm">
							<div class="card-body p-4">
								<div class="flex items-start justify-between">
									<div>
										<h3 class="font-semibold">{warp.name}</h3>
										<p class="text-sm text-base-content/60">{warp.location}</p>
										{#if warp.restrict && warp.restrict.length > 0}
											<p class="text-xs text-base-content/50">
												Restrictions: {warp.restrict.join(', ')}
											</p>
										{/if}
									</div>
									<form method="POST" action="?/warpDelete" use:enhance>
										<input type="hidden" name="name" value={warp.name} />
										<button class="btn btn-sm btn-error">
											<Trash2 size={16} />
										</button>
									</form>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- WORLDS TAB -->
		{#if currentTab === 'worlds'}
			<div class="space-y-4">
				{#if !showWorldForm}
					<button
						class="btn btn-primary"
						onclick={() => (showWorldForm = true)}
					>
						<Plus size={18} />
						Create World
					</button>
				{:else}
					<form method="POST" action="?/worldCreate" use:enhance class="card bg-base-100">
						<div class="card-body space-y-3">
							<h3 class="card-title text-lg">Create New World</h3>
							<input
								type="text"
								name="name"
								placeholder="World name"
								class="input input-bordered"
								required
							/>
							<select name="groupName" class="select select-bordered" required>
								<option value="">Select a world group</option>
								{#each data.groups as group}
									<option value={group.name}>{group.name}</option>
								{/each}
							</select>
							<input
								type="text"
								name="restrict"
								placeholder="Restrictions (comma-separated, optional)"
								class="input input-bordered"
							/>
							<div class="flex gap-2">
								<button type="submit" class="btn btn-primary">Create</button>
								<button
									type="button"
									class="btn btn-ghost"
									onclick={() => (showWorldForm = false)}
								>
									Cancel
								</button>
							</div>
						</div>
					</form>
				{/if}

				<div class="space-y-2">
					{#each data.worlds as world (world.name)}
						<div class="card bg-base-100 shadow-sm">
							<div class="card-body p-4">
								<div class="flex items-start justify-between">
									<div>
										<h3 class="font-semibold">{world.name}</h3>
										<p class="text-sm text-base-content/60">
											Group: {world.groupName}
										</p>
										{#if world.restrict && world.restrict.length > 0}
											<p class="text-xs text-base-content/50">
												Restrictions: {world.restrict.join(', ')}
											</p>
										{/if}
									</div>
									<form method="POST" action="?/worldDelete" use:enhance>
										<input type="hidden" name="name" value={world.name} />
										<button class="btn btn-sm btn-error">
											<Trash2 size={16} />
										</button>
									</form>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- WORLD GROUPS TAB -->
		{#if currentTab === 'groups'}
			<div class="space-y-4">
				{#if !showGroupForm}
					<button
						class="btn btn-primary"
						onclick={() => (showGroupForm = true)}
					>
						<Plus size={18} />
						Create Group
					</button>
				{:else}
					<form method="POST" action="?/groupCreate" use:enhance class="card bg-base-100">
						<div class="card-body space-y-3">
							<h3 class="card-title text-lg">Create New World Group</h3>
							<input
								type="text"
								name="name"
								placeholder="Group name"
								class="input input-bordered"
								required
							/>
							<select name="gameMode" class="select select-bordered">
								<option value="0">Survival (0)</option>
								<option value="1">Creative (1)</option>
								<option value="2">Adventure (2)</option>
								<option value="3">Spectator (3)</option>
							</select>
							<input
								type="text"
								name="restrict"
								placeholder="Restrictions (comma-separated, optional)"
								class="input input-bordered"
							/>
							<div class="flex gap-2">
								<button type="submit" class="btn btn-primary">Create</button>
								<button
									type="button"
									class="btn btn-ghost"
									onclick={() => (showGroupForm = false)}
								>
									Cancel
								</button>
							</div>
						</div>
					</form>
				{/if}

				<div class="space-y-2">
					{#each data.groups as group (group.name)}
						<div class="card bg-base-100 shadow-sm">
							<div class="card-body p-4">
								<div class="flex items-start justify-between">
									<div>
										<h3 class="font-semibold">{group.name}</h3>
										<p class="text-sm text-base-content/60">
											Game Mode: {['Survival', 'Creative', 'Adventure', 'Spectator'][
												group.gameMode
											]}
										</p>
										{#if group.restrict && group.restrict.length > 0}
											<p class="text-xs text-base-content/50">
												Restrictions: {group.restrict.join(', ')}
											</p>
										{/if}
									</div>
									<form method="POST" action="?/groupDelete" use:enhance>
										<input type="hidden" name="name" value={group.name} />
										<button class="btn btn-sm btn-error">
											<Trash2 size={16} />
										</button>
									</form>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>
