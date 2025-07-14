import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import path from 'path';

export const GET: RequestHandler = async ({ params }) => {
	if (!params.path) {
		error(400, 'Pfad zur Datei fehlt.');
	}

	//const absolutePath = path.resolve('/mnt/data/rizinos', params.path);
	const absolutePath = path.resolve('./', params.path);

	// Überprüfe, ob die Datei existiert
	if (!await Bun.file(absolutePath).exists()) {
		error(404, 'Datei nicht gefunden.');
	}

	// Lese den Dateinamen aus dem Pfad
	const fileName = path.basename(absolutePath);

	const isDirectory = await Bun.file(absolutePath).stat().then(f => f.isDirectory());

	if (isDirectory) { // TODO: Implement this correctly once database has a table for the file system
		error(400, 'Pfad ist ein Verzeichnis.');
	}

	const fileBuffer = Bun.file(absolutePath);

	return new Response(fileBuffer, {
		headers: {
			'Content-Type': 'application/octet-stream', // Generischer Typ für Downloads
			'Content-Disposition': `attachment; filename="${fileName}"`,
			'Content-Length': String(fileBuffer.size)
		}
	});
}
