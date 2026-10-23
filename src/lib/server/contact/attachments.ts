import { LIMITS } from './topics';

export type ImageMime = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';

const EXTENSION: Record<ImageMime, string> = {
	'image/png': 'png',
	'image/jpeg': 'jpg',
	'image/webp': 'webp',
	'image/gif': 'gif'
};

export function extensionFor(mime: ImageMime): string {
	return EXTENSION[mime];
}

const startsWith = (bytes: Uint8Array, sig: number[], offset = 0) =>
	sig.every((b, i) => bytes[offset + i] === b);

/**
 * Detects the real image type from magic bytes. The client-supplied MIME type and extension are
 * never trusted. SVG is intentionally not supported (script execution surface).
 */
export function sniffImage(bytes: Uint8Array): ImageMime | null {
	if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
	if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg';
	if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38]) && (bytes[4] === 0x37 || bytes[4] === 0x39))
		return 'image/gif';
	if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8))
		return 'image/webp';
	return null;
}

/** Keeps a display name only: no path parts, no control characters, bounded length. */
export function safeFilename(name: string, mime: ImageMime): string {
	const base = name
		.split(/[\\/]/)
		.pop()!
		.replace(/[^\p{L}\p{N}._ -]/gu, '_')
		.replace(/^\.+/, '')
		.slice(0, 80);
	const ext = EXTENSION[mime];
	const stem = base.replace(/\.[^.]*$/, '') || 'image';
	return `${stem}.${ext}`;
}

export type AttachmentIssue = 'too_many' | 'too_large' | 'unsupported_type' | 'empty';

export interface CheckedAttachment {
	filename: string;
	mimeType: ImageMime;
	size: number;
	bytes: Uint8Array;
}

export type AttachmentResult =
	{ ok: true; files: CheckedAttachment[] } | { ok: false; issue: AttachmentIssue; index?: number };

export async function checkAttachments(files: File[]): Promise<AttachmentResult> {
	if (files.length > LIMITS.attachments) return { ok: false, issue: 'too_many' };
	const checked: CheckedAttachment[] = [];
	for (const [index, file] of files.entries()) {
		if (file.size === 0) return { ok: false, issue: 'empty', index };
		if (file.size > LIMITS.attachmentBytes) return { ok: false, issue: 'too_large', index };
		const bytes = new Uint8Array(await file.arrayBuffer());
		const mimeType = sniffImage(bytes);
		if (!mimeType) return { ok: false, issue: 'unsupported_type', index };
		checked.push({
			filename: safeFilename(file.name, mimeType),
			mimeType,
			size: bytes.length,
			bytes
		});
	}
	return { ok: true, files: checked };
}
