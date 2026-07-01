export enum FileType {
	File = 'file',
	Directory = 'directory',
	Symlink = 'symlink'
}

// API response type for a VFS node
export interface VFSEntry {
	id: string;
	name: string;
	path: string;
	type: FileType;
	size: number | null;
	mimeType: string | null;
	blobHash: string | null;
	symlinkTarget: string | null;
	resolved: VFSEntry | null; // non-null only when type === Symlink
	createdAt: string;
	updatedAt: string;
}

// Desktop icon representation (OS shell layer)
export interface FileSystemObject {
	entry: VFSEntry;
	icon: string;
	isSelected: boolean;
}

export interface Desktop {
	files: (FileSystemObject | null)[];
	cols: number;
	rows: number;
}
