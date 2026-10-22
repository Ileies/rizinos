import { json } from '@sveltejs/kit';
export function GET() {
	return json({ version: __APP_VERSION__ });
}

export function POST() {
	return json({ version: __APP_VERSION__ });
}
