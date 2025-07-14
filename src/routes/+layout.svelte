<script lang="ts">
	import '../app.css';
	import { PUBLIC_APP_NAME } from '$env/static/public';
	import { page } from '$app/state';

	let { children } = $props();
</script>

<svelte:head>
	<meta content={PUBLIC_APP_NAME} name="application-name" />
	<meta content={page.data.seo.pageDescription} name="description" />
	<meta content={page.data.seo.keywords} property="keywords" />
	<meta content={page.data.seo.robots} name="robots" />
	<meta content={page.data.seo.pageTitle} name="twitter:title" />
	<meta content={page.data.seo.pageDescription} name="twitter:description" />
	<meta content={page.data.seo.twitterCard} name="twitter:card" />
	<meta content={page.data.seo.twitterSite} name="twitter:site" />
	<meta content={page.data.seo.ogUrl} property="og:url" />
	<meta content={page.data.seo.ogType} property="og:type" />
	<meta content={page.data.seo.pageTitle} property="og:title" />
	<meta content={page.data.seo.pageDescription} property="og:description" />
	<meta content={page.data.seo.ogImage} property="og:image" />
	<meta content="en_US" name="og:locale"> <!-- TODO: When paraglide is installed, add dynamic language -->
	<title>{page.data.seo.pageTitle}</title>
</svelte:head>

{@render children()}