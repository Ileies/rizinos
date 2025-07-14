export interface DefaultSeo {
	pageTitle: string;
	pageDescription: string;
	twitterCard: string;
	twitterSite: string;
	ogType: string;
	ogUrl: string;
	ogImage: string;
	keywords: string;
	robots: string;
}
export type Seo = Partial<DefaultSeo>;
export type LinkList = Record<string, string>;