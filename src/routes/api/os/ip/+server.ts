import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { IpInfo } from '$types';

async function getIPInfo(ip: string) {
	if (ip === '::1') ip = '';
	const data = await fetch(`http://ip-api.com/json/${ip}`).then(r => r.json()) as IpInfo;
	return json(data);
}

export const GET: RequestHandler = async (event) => {
	return await getIPInfo(event.locals.ip);
}

export const POST: RequestHandler = async (event) => {
	const { ip } = await event.request.json();
	return await getIPInfo(ip ?? event.locals.ip);
}
