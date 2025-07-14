import { PUBLIC_APP_NAME } from '$env/static/public';

import type { Seo } from '$types/seo';

export const load = async () => {
	const seo: Seo = {
		pageTitle: `${PUBLIC_APP_NAME} | About`,
		pageDescription: `The privacy policy for ${PUBLIC_APP_NAME}`
	};
	return { seo };
};
