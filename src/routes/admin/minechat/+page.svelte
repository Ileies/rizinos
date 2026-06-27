<script lang="ts">
	import { Users, Webhook, Server } from '@lucide/svelte';
	import * as Table from '$shadcn/table';

	let { data } = $props();

	let currentTab = $state('users');

	const innerTabs = [
		{ id: 'users', label: 'Users', icon: Users, count: () => data.users.length },
		{ id: 'hooks', label: 'Hooks', icon: Webhook, count: () => data.hooks.length },
		{ id: 'servers', label: 'Servers', icon: Server, count: () => data.servers.length }
	];
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
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>MC Name</Table.Head>
					<Table.Head>MC UUID</Table.Head>
					<Table.Head>Discord User ID</Table.Head>
					<Table.Head class="w-24">Token</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.users as user (user.minecraftUuid)}
					<Table.Row class="hover:bg-muted/40">
						<Table.Cell class="py-1.5 font-medium">{user.minecraftName}</Table.Cell>
						<Table.Cell class="py-1.5 font-mono text-xs text-muted-foreground">{user.minecraftUuid}</Table.Cell>
						<Table.Cell class="py-1.5 font-mono text-xs text-muted-foreground">{user.discordUserId}</Table.Cell>
						<Table.Cell class="py-1.5">
							{#if user.token}
								<span class="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400">set</span>
							{:else}
								<span class="text-xs text-muted-foreground/40">-</span>
							{/if}
						</Table.Cell>
					</Table.Row>
				{/each}
				{#if data.users.length === 0}
					<Table.Row>
						<Table.Cell colspan={4} class="py-8 text-center text-sm text-muted-foreground">No users</Table.Cell>
					</Table.Row>
				{/if}
			</Table.Body>
		</Table.Root>
	{/if}

	<!-- HOOKS -->
	{#if currentTab === 'hooks'}
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Webhook ID</Table.Head>
					<Table.Head>Channel ID</Table.Head>
					<Table.Head>Server</Table.Head>
					<Table.Head class="w-32">Prefix</Table.Head>
					<Table.Head class="w-24">Token</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.hooks as hook (hook.webhookId)}
					<Table.Row class="hover:bg-muted/40">
						<Table.Cell class="py-1.5 font-mono text-xs text-muted-foreground">{hook.webhookId}</Table.Cell>
						<Table.Cell class="py-1.5 font-mono text-xs text-muted-foreground">{hook.channelId}</Table.Cell>
						<Table.Cell class="py-1.5 text-sm">{hook.server?.ip ?? hook.minecraftServerId}</Table.Cell>
						<Table.Cell class="py-1.5 font-mono text-xs">{hook.prefix}</Table.Cell>
						<Table.Cell class="py-1.5 font-mono text-xs text-muted-foreground">
							<span class="block max-w-[80px] truncate" title={hook.token}>{hook.token}</span>
						</Table.Cell>
					</Table.Row>
				{/each}
				{#if data.hooks.length === 0}
					<Table.Row>
						<Table.Cell colspan={5} class="py-8 text-center text-sm text-muted-foreground">No hooks</Table.Cell>
					</Table.Row>
				{/if}
			</Table.Body>
		</Table.Root>
	{/if}

	<!-- SERVERS -->
	{#if currentTab === 'servers'}
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Server ID</Table.Head>
					<Table.Head>IP</Table.Head>
					<Table.Head class="w-32">Hook</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.servers as server (server.serverId)}
					<Table.Row class="hover:bg-muted/40">
						<Table.Cell class="py-1.5 font-mono text-sm">{server.serverId}</Table.Cell>
						<Table.Cell class="py-1.5 text-sm">{server.ip}</Table.Cell>
						<Table.Cell class="py-1.5">
							{#if server.hook}
								<span class="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400">linked</span>
							{:else}
								<span class="text-xs text-muted-foreground/40">none</span>
							{/if}
						</Table.Cell>
					</Table.Row>
				{/each}
				{#if data.servers.length === 0}
					<Table.Row>
						<Table.Cell colspan={3} class="py-8 text-center text-sm text-muted-foreground">No servers</Table.Cell>
					</Table.Row>
				{/if}
			</Table.Body>
		</Table.Root>
	{/if}
</div>
