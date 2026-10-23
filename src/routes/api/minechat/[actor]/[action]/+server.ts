import type { RequestHandler } from '@sveltejs/kit';
import { handleMinechat } from '#lib/server/minechat/api.js';

export const POST: RequestHandler = ({ request, params }) =>
	handleMinechat(request, params.actor!, params.action!, process.env.MINECHAT_BOT_SECRET);
