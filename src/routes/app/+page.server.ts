import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) redirect(302, '/login');

	// TODO: List background services to be auto-started
	// TODO: Maybe at some point let users configure what they want to synchronize (processes, desktop, etc.)
	// TODO: Apps will have tokens per user that define what apis the app can access
	// TODO: Use API tokens in all endpoints.
	// TODO: Verify input data in all endpoints.
	// TODO: Use DB transactions more often generally.
	// TODO: devices[sessionsToken] needs to be rethought (DB)
	// TODO: Project needs an app store
	// TODO: Rethink desktop.ini
	// TODO: CB.write('file', {path, isMoving})
	// TODO: At some point support these languages too:  'es', 'fr', 'pt', 'hi', 'ar'

	return {
		username: locals.user.username
	};
};
