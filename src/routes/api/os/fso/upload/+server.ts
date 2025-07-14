import { join } from 'path';
import { json } from '@sveltejs/kit';
import { invalidMethod } from '$lib/server';
import { STORAGE_DIRECTORY } from '$env/static/private';
import { dev } from '$app/environment';

export const GET = invalidMethod;

export const POST = async ({ request }) => {
	const data = await request.formData();
	const files = data.getAll('files');

	if (files.length === 0) {
		return json({ error: 'No files uploaded' }, { status: 400 });
	}

	for (const file of files) {
		if (file instanceof File) {
			await Bun.write(join(dev ? './uploads' : STORAGE_DIRECTORY, file.name), file); // TODO: Save to the right directory
		} else {
			return json({ error: 'Invalid file format' }, { status: 500 });
		}
	}
	return json({ message: 'Files uploaded successfully' });
};