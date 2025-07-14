import { json, type RequestEvent } from '@sveltejs/kit';
import { invalidMethod } from '$lib/server';

export const GET = invalidMethod;

export async function POST(event: RequestEvent) {
	const { from, to } = await event.request.json();

	/*// TODO: Retrieve storage path
	const userPath = '';
	const pathFrom = userPath + from;
	const pathTo = userPath + to;





	// Determine user storage path
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

	//


	const input = Bun.file(pathFrom);
	if (!await input.exists()) {
		return json({ error: 'File not found' });
	}
	const output = Bun.file(pathTo);
	if (await output.exists()) {
		return json({ error: 'File already exists' });
	}

	await Bun.write(output, input);

*/
	return json(1);
}
