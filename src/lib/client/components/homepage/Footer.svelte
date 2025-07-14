<script lang="ts">
	import { Github, Twitter } from 'lucide-svelte';
	import { PUBLIC_APP_NAME } from '$env/static/public';
	import type { LinkList } from '$types/seo';
	import { m } from '$lib/paraglide/messages.js';

	const legal: LinkList = {
		'/privacy': m.privacy_policy(),
		'/terms': m.terms_of_service(),
		'/privacy/#cookies': m.cookies(),
		'/legal': m.imprint()
	};

	const links: { title: string, items: LinkList }[] = [
		{
			title: m.product(),
			items: {
				'/#features': m.features(),
				'/#security': m.security(),
				'/enterprise': m.enterprise(),
				'/pricing': m.pricing()
			}
		},
		{
			title: m.resources(),
			items: {
				'/docs': m.documentation(),
				'/docs#api': m.api_reference(),
				'/status': m.status(),
				'/blog': m.blog()
			}
		},
		{
			title: m.company(),
			items: {
				'/about': m.about_us(),
				'/careers': m.careers(),
				'/about#contact': m.contact()
			}
		},
		{
			title: m.legal(),
			items: legal
		}
	];
</script>

<div class="h-2 bg-gradient-to-r from-primary to-secondary"></div>

<footer class="bg-base-200 pt-20 pb-12 border-t border-base-300">
	<div class="container mx-auto px-4 lg:px-8">
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12">
			<!-- Brand Section -->
			<div class="lg:col-span-2">

				<a class="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
					 href="/"
				>
					{PUBLIC_APP_NAME}
				</a>
				<p class="mt-4 text-base-content/70 leading-relaxed">
					{m.description()}
				</p>
				<div class="flex space-x-4 mt-6">

					<a class="text-base-content/50 hover:text-base-content transition-colors duration-200" href="#a">
						<Twitter size={24} />
					</a>

					<a class="text-base-content/50 hover:text-base-content transition-colors duration-200" href="#a">
						<Github size={24} />
					</a>
				</div>
			</div>

			<!-- Links Sections -->
			{#each links as section (section.title)}
				<div>
					<h3 class="font-semibold text-base-content mb-4">{section.title}</h3>
					<ul class="space-y-3">
						{#each Object.entries(section.items) as [href, name] (href)}
							<li>

								<a class="text-base-content/70 hover:text-base-content transition-colors duration-200"
									 href={href}
								>
									{name}
								</a>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>

		<!-- Footer Bottom -->
		<div class="mt-12 pt-8 border-t border-base-300">
			<div class="flex flex-col md:flex-row justify-between items-center">
				<p class="text-base-content/60">&copy; 2019-{new Date().getFullYear()} {PUBLIC_APP_NAME}. {m.copyright()}</p>
				<div class="flex flex-wrap justify-center space-x-6 mt-4 md:mt-0">
					{#each Object.entries(legal) as [href, name] (href)}

						<a class="text-base-content/60 hover:text-base-content transition-colors duration-200"
							 href={href}>{name}</a>
					{/each}
				</div>
			</div>
		</div>
	</div>
</footer>
