import { join } from 'path';
import { unlink } from 'fs/promises';
import { dev } from '$app/environment';
import { STORAGE_DIRECTORY } from '$env/static/private';
import { db } from '$db';
import { blobs, files } from '$db/schema';
import { eq, inArray, sql } from 'drizzle-orm';
import { blake3 } from '@noble/hashes/blake3.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { FileType, type VFSEntry } from '$types';

export function storagePath(hash: string): string {
	return join(dev ? './uploads' : STORAGE_DIRECTORY, hash);
}

export async function hashBuffer(buffer: ArrayBuffer): Promise<string> {
	return bytesToHex(blake3(new Uint8Array(buffer)));
}

// A directory D's listing path (= its children's path value) = D.path + D.id + "/"
export function listingPath(dir: { path: string; id: string }): string {
	return dir.path + dir.id + '/';
}

// Creates blob if missing. Returns true if newly written to disk.
export async function ensureBlob(hash: string, file: File): Promise<boolean> {
	const existing = await db
		.select({ hash: blobs.hash })
		.from(blobs)
		.where(eq(blobs.hash, hash))
		.limit(1);
	if (existing.length > 0) return false;

	await Bun.write(storagePath(hash), file);
	await db.insert(blobs).values({
		hash,
		size: file.size,
		mimeType: file.type || 'application/octet-stream'
	});
	return true;
}

export async function blobRefCount(hash: string): Promise<number> {
	const result = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(files)
		.where(eq(files.blobHash, hash));
	return result[0]?.count ?? 0;
}

export async function deleteBlobIfUnreferenced(hash: string): Promise<void> {
	if ((await blobRefCount(hash)) > 0) return;
	await db.delete(blobs).where(eq(blobs.hash, hash));
	await unlink(storagePath(hash)).catch(() => {});
}

export function toVFSEntry(
	row: typeof files.$inferSelect,
	resolved: typeof files.$inferSelect | null = null
): VFSEntry {
	return {
		id: row.id,
		name: row.name,
		path: row.path,
		type: row.type as FileType,
		size: row.size,
		mimeType: row.mimeType,
		blobHash: row.blobHash,
		symlinkTarget: row.symlinkTarget,
		resolved: resolved ? toVFSEntry(resolved) : null,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString()
	};
}

export async function listDirectory(dirPath: string, ownerId: string): Promise<VFSEntry[]> {
	const children = await db
		.select()
		.from(files)
		.where(sql`${files.path} = ${dirPath} AND ${files.ownerId} = ${ownerId}`);

	const symlinkTargetIds = children
		.filter((f) => f.type === FileType.Symlink && f.symlinkTarget)
		.map((f) => f.symlinkTarget!);

	let resolvedMap: Record<string, typeof files.$inferSelect> = {};
	if (symlinkTargetIds.length > 0) {
		const targets = await db.select().from(files).where(inArray(files.id, symlinkTargetIds));
		resolvedMap = Object.fromEntries(targets.map((t) => [t.id, t]));
	}

	return children.map((f) =>
		toVFSEntry(f, f.symlinkTarget ? (resolvedMap[f.symlinkTarget] ?? null) : null)
	);
}
