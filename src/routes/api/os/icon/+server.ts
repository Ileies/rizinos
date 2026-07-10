import type { RequestHandler } from './$types';
import { FileType } from '$types';
import { invalidMethod } from '$lib/server';

type Category = 'folder' | 'image' | 'video' | 'audio' | 'archive' | 'text' | 'file';

const ARCHIVE_MIME_TYPES = new Set([
	'application/zip',
	'application/gzip',
	'application/x-tar',
	'application/x-7z-compressed',
	'application/vnd.rar',
	'application/x-rar-compressed'
]);

function categorize(type: string | null, mimeType: string | null): Category {
	if (type === FileType.Directory) return 'folder';
	if (!mimeType) return 'file';
	if (mimeType.startsWith('image/')) return 'image';
	if (mimeType.startsWith('video/')) return 'video';
	if (mimeType.startsWith('audio/')) return 'audio';
	if (ARCHIVE_MIME_TYPES.has(mimeType)) return 'archive';
	if (
		mimeType.startsWith('text/') ||
		mimeType === 'application/json' ||
		mimeType === 'application/pdf'
	)
		return 'text';
	return 'file';
}

// Outline shapes, viewBox 0 0 24 24, roughly matching lucide's folder/file family
const FILE_BASE =
	'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>';

const SHAPES: Record<Category, string> = {
	folder:
		'<path d="M3 6a2 2 0 0 1 2-2h4.17a2 2 0 0 1 1.41.59L12 6h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
	file: FILE_BASE,
	image: `${FILE_BASE}<circle cx="10" cy="13" r="1.5"/><path d="M20 17l-3.5-3.5a1 1 0 0 0-1.4 0L9 19"/>`,
	video: `${FILE_BASE}<path d="M10 12.5v5l4-2.5Z"/>`,
	audio: `${FILE_BASE}<circle cx="9" cy="17" r="1.5"/><circle cx="14.5" cy="15.5" r="1.5"/><path d="M10.5 17V10l4-1v6.5"/>`,
	archive: `${FILE_BASE}<path d="M10 11h4M10 13h4M10 15h4"/>`,
	text: `${FILE_BASE}<path d="M8 13h8M8 17h5"/>`
};

export const GET: RequestHandler = ({ url }) => {
	const category = categorize(url.searchParams.get('type'), url.searchParams.get('mime'));

	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${SHAPES[category]}</svg>`;

	return new Response(svg, {
		headers: {
			'Content-Type': 'image/svg+xml',
			'Cache-Control': 'public, max-age=86400'
		}
	});
};

export const POST = invalidMethod;
