import { json, type RequestEvent } from '@sveltejs/kit';
import { invalidMethod } from '$lib/server';

export const GET = invalidMethod;

export async function POST(event: RequestEvent) {
	/*const { url } = await event.request.json();

	// Determine user storage path
	const userPath = '';
	let path;
	let file;

	do {
		path = userPath + url;
		file = Bun.file(path);
		if (!await file.exists()) {
			return json({ error: 'File not found' });
		}
		// Check if url is file or directory
		// Delete url
		// Set url to parent
	} while (file);

	// Check if url exists While url is link, set url to target

	// Check if token has permission to delete url

	// Check if url is file or directory





	const path = "/path/to/file.txt";

	const file = Bun.file(path);

	(await fs.lstat(path)).isDirectory()


	await fs.rm('dist', { recursive: true, force: true })
	await fs.unlink(path);*/

	return json(1);
}
