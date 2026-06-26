<script lang="ts">
	import { enhance } from '$app/forms';
	import { Role } from '$types';
	import { ChevronDown, Users, Zap, Settings } from '@lucide/svelte';
	import * as Card from '$shadcn/card';
	import * as Button from '$shadcn/button';
	import { Badge } from '$shadcn/badge';
	import InlineEdit from '$lib/components/InlineEdit.svelte';

	let { data } = $props();

	let expandedUsers = $state<Record<string, boolean>>({});

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
								<div class="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2 lg:grid-cols-3">
									<InlineEdit
										value={user.username}
										label="Username"
										action="?/userUpdateUsername"
										fieldName="username"
										hiddenFields={{ userId: user.id }}
									/>

									<InlineEdit
										value={user.email}
										label="Email"
										action="?/userUpdateEmail"
										fieldName="email"
										hiddenFields={{ userId: user.id }}
										type="text"
									/>

									<InlineEdit
										value="*"
										label="Password"
										action="?/userUpdatePassword"
										fieldName="newPassword"
										hiddenFields={{ userId: user.id }}
										type="text"
									>
										<p class="text-sm text-muted-foreground">Set new password</p>
									</InlineEdit>

									<InlineEdit
										value={user.credit}
										label="Credit"
										action="?/creditSet"
										fieldName="credit"
										hiddenFields={{ userId: user.id }}
										type="number"
									/>

									<InlineEdit
										value={user.gender || ''}
										label="Gender"
										action="?/userUpdate"
										fieldName="gender"
										hiddenFields={{ userId: user.id }}
										type="select"
										selectOptions={[
											{ value: 'male', label: 'Male' },
											{ value: 'female', label: 'Female' },
											{ value: 'other', label: 'Other' }
										]}
									/>

									<div>
										<p class="text-xs font-medium text-muted-foreground uppercase">User ID</p>
										<p class="text-xs font-mono mt-3 break-all">{user.id}</p>
									</div>

									<div>
										<p class="text-xs font-medium text-muted-foreground uppercase">Last Online</p>
										<p class="text-sm mt-3">{new Date(user.lastOnline).toLocaleDateString()}</p>
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

								</div>
							</div>
						{/if}
					</div>
				</Card.Root>
			{/each}
		</div>
	</div>
</div>
