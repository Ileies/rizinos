<script lang="ts">
	import { enhance } from '$app/forms';
	import { Role } from '$types';
	import { ChevronDown, Users, Zap, Settings, Edit2, Check, X } from '@lucide/svelte';
	import * as Card from '$shadcn/card';
	import * as Button from '$shadcn/button';
	import { Badge } from '$shadcn/badge';
	import * as Input from '$shadcn/input';

	let { data } = $props();

	let expandedUsers = $state<Record<string, boolean>>({});
	let editingCredit = $state<Record<string, boolean>>({});
	let editingGender = $state<Record<string, boolean>>({});

	const ROLES = [
		Role.Admin,
		Role.Moderator,
		Role.BetaTester,
		Role.User,
		Role.Developer,
		Role.Supporter
	];

	function toggleUser(userId: string) {
		expandedUsers[userId] = !expandedUsers[userId];
	}

	function toggleCreditEdit(userId: string) {
		editingCredit[userId] = !editingCredit[userId];
	}

	function toggleGenderEdit(userId: string) {
		editingGender[userId] = !editingGender[userId];
	}
</script>

<div class="min-h-screen bg-background">
	<div class="border-b">
		<div class="mx-auto max-w-7xl px-6 py-6">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="rounded-lg bg-primary p-2">
						<Users class="h-6 w-6 text-primary-foreground" />
					</div>
					<div>
						<h1 class="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
						<p class="text-sm text-muted-foreground mt-1">Manage users and system settings</p>
					</div>
				</div>
				<Button.Root href="/admin/minecraft" class="flex items-center gap-2">
					<Settings class="h-4 w-4" />
					Minecraft Settings
				</Button.Root>
			</div>
		</div>
	</div>

	<div class="mx-auto max-w-7xl px-6 py-8">
		<div class="mb-8">
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<Users class="h-4 w-4" />
				<span>{data.users.length} users</span>
			</div>
		</div>

		<div class="space-y-3">
			{#each data.users as user (user.id)}
				<Card.Root class="overflow-hidden transition-all hover:shadow-md hover:bg-muted/30">
					<div class="flex flex-col">
						<button
							class="flex w-full items-center justify-between px-6 py-4 text-left transition-colors"
							onclick={() => toggleUser(user.id)}
						>
							<div class="flex-1">
								<div class="flex items-center gap-3 mb-2">
									<h3 class="font-semibold text-base">{user.username}</h3>
									{#if user.roles.length > 0}
										<div class="flex gap-1 flex-wrap">
											{#each user.roles as role}
												<Badge variant="default">
													{role}
												</Badge>
											{/each}
										</div>
									{/if}
								</div>
								<p class="text-sm text-muted-foreground">{user.email}</p>
							</div>
							<ChevronDown
								size={20}
								class="transition-transform {expandedUsers[user.id] ? 'rotate-180' : ''}"
							/>
						</button>

						{#if expandedUsers[user.id]}
							<div class="border-t px-6 py-4 bg-muted/30">
								<div class="grid grid-cols-2 gap-4 mb-6 md:grid-cols-4">
									<div>
										<p class="text-xs font-medium text-muted-foreground uppercase mb-2">Credit</p>
										{#if !editingCredit[user.id]}
											<div class="flex items-center justify-between">
												<p class="text-lg font-semibold">{user.credit}</p>
												<Button.Root type="button" variant="ghost" size="sm" onclick={() => toggleCreditEdit(user.id)}>
													<Edit2 size={14} />
												</Button.Root>
											</div>
										{:else}
											<form method="POST" action="?/creditSet" use:enhance class="flex gap-2" onsubmit={() => toggleCreditEdit(user.id)}>
												<input type="hidden" name="userId" value={user.id} />
												<Input.Root name="credit" type="number" value={user.credit.toString()} required class="text-sm" />
												<Button.Root type="submit" variant="ghost" size="sm">
													<Check size={14} />
												</Button.Root>
												<Button.Root type="button" variant="ghost" size="sm" onclick={() => toggleCreditEdit(user.id)}>
													<X size={14} />
												</Button.Root>
											</form>
										{/if}
									</div>
									<div>
										<p class="text-xs font-medium text-muted-foreground uppercase mb-2">Gender</p>
										{#if !editingGender[user.id]}
											<div class="flex items-center justify-between">
												<p class="capitalize text-sm">{user.gender || '-'}</p>
												<Button.Root type="button" variant="ghost" size="sm" onclick={() => toggleGenderEdit(user.id)}>
													<Edit2 size={14} />
												</Button.Root>
											</div>
										{:else}
											<form method="POST" action="?/userUpdate" use:enhance class="flex gap-2" onsubmit={() => toggleGenderEdit(user.id)}>
												<input type="hidden" name="userId" value={user.id} />
												<select name="gender" class="flex-1 px-2 py-1 border rounded-md bg-background text-sm">
													<option value="">Select gender</option>
													<option value="male" selected={user.gender === 'male'}>Male</option>
													<option value="female" selected={user.gender === 'female'}>Female</option>
													<option value="other" selected={user.gender === 'other'}>Other</option>
												</select>
												<Button.Root type="submit" variant="ghost" size="sm">
													<Check size={14} />
												</Button.Root>
												<Button.Root type="button" variant="ghost" size="sm" onclick={() => toggleGenderEdit(user.id)}>
													<X size={14} />
												</Button.Root>
											</form>
										{/if}
									</div>
									<div>
										<p class="text-xs font-medium text-muted-foreground uppercase">Last Online</p>
										<p class="text-sm mt-1">{new Date(user.lastOnline).toLocaleDateString()}</p>
									</div>
									<div>
										<p class="text-xs font-medium text-muted-foreground uppercase">ID</p>
										<p class="text-sm font-mono mt-1">{user.id.slice(0, 8)}...</p>
									</div>
								</div>

								<div class="space-y-4 border-t pt-4">
									<div>
										<h4 class="font-semibold text-sm mb-3">Role Management</h4>
										<div class="flex flex-wrap gap-2">
											{#each ROLES as role}
												{@const hasRole = user.roles.includes(role)}
												{#if hasRole}
													<form method="POST" action="?/userRemoveRole" use:enhance>
														<input type="hidden" name="userId" value={user.id} />
														<input type="hidden" name="role" value={role} />
														<Button.Root variant="destructive" size="sm" type="submit">
															- {role}
														</Button.Root>
													</form>
												{:else}
													<form method="POST" action="?/userAddRole" use:enhance>
														<input type="hidden" name="userId" value={user.id} />
														<input type="hidden" name="role" value={role} />
														<Button.Root variant="outline" size="sm" type="submit">
															+ {role}
														</Button.Root>
													</form>
												{/if}
											{/each}
										</div>
									</div>

									<div class="border-t pt-4">
										<h4 class="font-semibold text-sm mb-3 flex items-center gap-2">
											<Zap class="h-4 w-4" />
											Adjust Credit
										</h4>
										{#if !editingCredit[user.id]}
											<Button.Root
												variant="outline"
												size="sm"
												onclick={() => toggleCreditEdit(user.id)}
											>
												Edit Credit
											</Button.Root>
										{:else}
											<form
												method="POST"
												action="?/creditAdjust"
												use:enhance
												class="flex gap-2"
												onsubmit={() => toggleCreditEdit(user.id)}
											>
												<input type="hidden" name="userId" value={user.id} />
												<Input.Root class="flex-1" placeholder="0" name="amount" type="number" />
												<Button.Root type="submit" size="sm">Apply</Button.Root>
												<Button.Root
													type="button"
													variant="ghost"
													size="sm"
													onclick={() => toggleCreditEdit(user.id)}
												>
													Cancel
												</Button.Root>
											</form>
										{/if}
									</div>
								</div>
							</div>
						{/if}
					</div>
				</Card.Root>
			{/each}
		</div>
	</div>
</div>
