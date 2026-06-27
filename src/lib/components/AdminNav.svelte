<script lang="ts">
	import { page } from '$app/state';
	import { LayoutDashboard, Pickaxe, MessageSquare, Bot } from '@lucide/svelte';

	const tabs = [
		{ label: 'RizinOS', href: '/admin', icon: LayoutDashboard },
		{ label: 'Minecraft', href: '/admin/minecraft', icon: Pickaxe },
		{ label: 'Minechat', href: '/admin/minechat', icon: MessageSquare },
		{ label: 'Discord', href: '/admin/discord', icon: Bot }
	];

	function isActive(href: string) {
		if (href === '/admin') return page.url.pathname === '/admin';
		return page.url.pathname.startsWith(href);
	}
</script>

<div class="border-b">
	<div class="mx-auto max-w-7xl px-6">
		<div class="flex">
			{#each tabs as tab}
				{@const active = isActive(tab.href)}
				{@const Icon = tab.icon}
				<a
					href={tab.href}
					class="flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors {active
						? 'border-primary text-primary'
						: 'border-transparent text-muted-foreground hover:text-foreground'}"
				>
					<Icon class="h-3.5 w-3.5" />
					{tab.label}
				</a>
			{/each}
		</div>
	</div>
</div>
