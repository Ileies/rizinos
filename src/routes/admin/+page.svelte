<script lang="ts">
	import { enhance } from '$app/forms';
	import { Role } from '$types';
	import { Trash2, ChevronDown } from '@lucide/svelte';

	let {
		data
	} = $props();

	let expandedUsers = $state<Record<string, boolean>>({});
	let showCreditForm = $state<string | null>(null);

	const ROLES = [Role.Admin, Role.Moderator, Role.BetaTester, Role.User, Role.Developer, Role.Supporter];

	function toggleUser(userId: string) {
		expandedUsers[userId] = !expandedUsers[userId];
	}
</script>

<div class="min-h-screen bg-base-200 p-4">
	<div class="mx-auto max-w-6xl">
		<div class="mb-8 flex items-center justify-between">
			<h1 class="text-3xl font-bold">Admin Dashboard</h1>
			<a href="/admin/minecraft" class="btn btn-outline">
				Manage Minecraft
			</a>
		</div>

		<div class="space-y-4">
			<p class="text-sm text-base-content/60">
				{data.users.length} users total
			</p>

			{#each data.users as user (user.id)}
				<div class="card bg-base-100 shadow-sm">
					<div class="card-body p-4">
						<button
							class="flex w-full items-center justify-between text-left"
							onclick={() => toggleUser(user.id)}
						>
							<div>
								<h3 class="font-semibold">{user.username}</h3>
								<p class="text-sm text-base-content/60">{user.email}</p>
							</div>
							<ChevronDown size={20} class={expandedUsers[user.id] ? 'rotate-180' : ''} />
						</button>

						{#if expandedUsers[user.id]}
							<div class="mt-4 space-y-3 border-t pt-4">
								<div class="grid grid-cols-2 gap-2 text-sm">
									<div>
										<span class="label-text font-semibold">Credit:</span>
										<p>{user.credit}</p>
									</div>
									<div>
										<span class="label-text font-semibold">Gender:</span>
										<p class="capitalize">{user.gender}</p>
									</div>
									<div>
										<span class="label-text font-semibold">Last Online:</span>
										<p>{new Date(user.lastOnline).toLocaleDateString()}</p>
									</div>
									<div>
										<span class="label-text font-semibold">Roles:</span>
										<p>{user.roles.length === 0 ? 'None' : user.roles.join(', ')}</p>
									</div>
								</div>

								<!-- Role Management -->
								<div class="space-y-2 border-t pt-3">
									<p class="font-semibold">Manage Roles</p>
									<div class="space-y-1">
										{#each ROLES as role}
											{@const hasRole = user.roles.includes(role)}
											<div class="flex items-center gap-2">
												{#if hasRole}
													<form method="POST" action="?/userRemoveRole" use:enhance>
														<input type="hidden" name="userId" value={user.id} />
														<input type="hidden" name="role" value={role} />
														<button class="btn btn-sm btn-error">
															Remove {role}
														</button>
													</form>
												{:else}
													<form method="POST" action="?/userAddRole" use:enhance>
														<input type="hidden" name="userId" value={user.id} />
														<input type="hidden" name="role" value={role} />
														<button class="btn btn-sm btn-success">
															Add {role}
														</button>
													</form>
												{/if}
											</div>
										{/each}
									</div>
								</div>

								<!-- Adjust Credit -->
								{#if !showCreditForm || showCreditForm !== user.id}
									<button
										class="btn btn-sm btn-outline"
										onclick={() => (showCreditForm = user.id)}
									>
										Adjust Credit
									</button>
								{:else}
									<form
										method="POST"
										action="?/creditAdjust"
										use:enhance
										class="space-y-2"
									>
										<input type="hidden" name="userId" value={user.id} />
										<div class="flex gap-2">
											<input
												type="number"
												name="amount"
												placeholder="Amount (can be negative)"
												class="input input-sm input-bordered flex-1"
											/>
											<button type="submit" class="btn btn-sm btn-primary">
												Add
											</button>
											<button
												type="button"
												class="btn btn-sm btn-ghost"
												onclick={() => (showCreditForm = null)}
											>
												Cancel
											</button>
										</div>
									</form>
								{/if}
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
