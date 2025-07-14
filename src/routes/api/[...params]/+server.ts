import { json } from '@sveltejs/kit';

const invalidEndpoint = () => json({ message: 'Invalid endpoint' });

export const GET = invalidEndpoint;
export const POST = invalidEndpoint;
