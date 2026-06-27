export const load = ({ locals }) => {
	return { loggedIn: !!locals.user };
};
