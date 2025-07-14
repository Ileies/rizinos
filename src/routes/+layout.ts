import { PUBLIC_GOOGLE_ANALYTICS_ID, PUBLIC_ORIGIN } from '$env/static/public';
import type { DefaultSeo } from '$types/seo';
//import posthog from 'posthog-js';
import { browser } from '$app/environment';
import { m } from '$lib/paraglide/messages.js';

export const load = () => {
	if (browser) {
		const googleAnalytics = document.createElement('script');
		googleAnalytics.async = true;
		googleAnalytics.src = `https://www.googletagmanager.com/gtag/js?id=${PUBLIC_GOOGLE_ANALYTICS_ID}`;
		document.documentElement.appendChild(googleAnalytics);

		window.dataLayer = window.dataLayer || [];
		window.dataLayer.push('js', new Date());
		window.dataLayer.push('config', PUBLIC_GOOGLE_ANALYTICS_ID);

		/*posthog.init(
			PUBLIC_POSTHOG_KEY,
			{
				api_host: 'https://eu.i.posthog.com',
				person_profiles: 'always'
			}
		);*/
	}

	const seo: DefaultSeo = {
		pageTitle: m.title(),
		pageDescription: m.description(),
		twitterCard: 'summary_large_image',
		twitterSite: `@rizin_os`,
		ogType: 'website',
		ogUrl: `https://${PUBLIC_ORIGIN}/`,
		ogImage: `${PUBLIC_ORIGIN}/socialcard.jpeg`,
		keywords: 'RizinOS,Linux,macOS,Windows,rizino,rizin,Ileies,Blitz,OS',
		robots: 'noindex, nofollow' // TODO: Set live when page is ready
	};
	return { seo };
};
