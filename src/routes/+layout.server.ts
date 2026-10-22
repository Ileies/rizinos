import { ORIGIN } from '$app/env/private';
import type { DefaultSeo } from '$types/seo';

export const load = () => {
	const seo: DefaultSeo = {
		pageTitle: 'RizinOS',
		pageDescription: 'RizinOS - Web-native operating system',
		twitterCard: 'summary_large_image',
		twitterSite: `@rizinos`,
		ogType: 'website',
		ogUrl: `${ORIGIN}/`,
		ogImage: `${ORIGIN}/socialcard.jpeg`,
		keywords: 'RizinOS,Linux,macOS,Windows,rizino,rizin,Ileies,Blitz,OS',
		robots: 'noindex, nofollow'
	};
	return { seo };
};
