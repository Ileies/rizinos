import { PUBLIC_ORIGIN } from '$env/static/public';
import type { DefaultSeo } from '$types/seo';

export const load = () => {
	const seo: DefaultSeo = {
		pageTitle: 'RizinOS',
		pageDescription: 'RizinOS - Web-native operating system',
		twitterCard: 'summary_large_image',
		twitterSite: `@rizinos`,
		ogType: 'website',
		ogUrl: `https://${PUBLIC_ORIGIN}/`,
		ogImage: `${PUBLIC_ORIGIN}/socialcard.jpeg`,
		keywords: 'RizinOS,Linux,macOS,Windows,rizino,rizin,Ileies,Blitz,OS',
		robots: 'noindex, nofollow'
	};
	return { seo };
};
