<script lang="ts">
	import { Bot } from '@lucide/svelte';
	import * as Table from '$shadcn/table';

	let { data } = $props();
</script>

<div class="mx-auto max-w-7xl px-6 py-4">
	<div class="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
		<Bot class="h-4 w-4" />
		<span>Discord Users</span>
		<span class="text-xs">({data.dcUsers.length})</span>
	</div>

	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>Discord Name</Table.Head>
				<Table.Head>Discord User ID</Table.Head>
				<Table.Head>RizinOS Account</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each data.dcUsers as dc (dc.discordUserId)}
				<Table.Row class="hover:bg-muted/40">
					<Table.Cell class="py-1.5 font-medium">{dc.name}</Table.Cell>
					<Table.Cell class="py-1.5 font-mono text-xs text-muted-foreground">{dc.discordUserId}</Table.Cell>
					<Table.Cell class="py-1.5 text-sm text-muted-foreground">{dc.user?.username ?? '-'}</Table.Cell>
				</Table.Row>
			{/each}
			{#if data.dcUsers.length === 0}
				<Table.Row>
					<Table.Cell colspan={3} class="py-8 text-center text-sm text-muted-foreground">No Discord users linked</Table.Cell>
				</Table.Row>
			{/if}
		</Table.Body>
	</Table.Root>
</div>
