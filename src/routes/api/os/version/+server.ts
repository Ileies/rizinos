import { json } from '@sveltejs/kit';
import { PUBLIC_VERSION } from '$app/env/public';

export function GET() {
	return json({ version: PUBLIC_VERSION });
}

export function POST() {
	return json({ version: PUBLIC_VERSION });
}
