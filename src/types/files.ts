export enum FileType {
	File = 'file',
	Directory = 'directory',
	Symlink = 'symlink',
}

export interface FileSystemObject {
	url: string;
	type: FileType;
	icon: string;
	size: number;
	isSelected: boolean;
}

export interface Desktop {
	files: (FileSystemObject | null)[];
	cols: number;
	rows: number;
}
