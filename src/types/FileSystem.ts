export interface FileEntry {
	name: string;
	path: string;
	is_dir: boolean;
	children?: FileEntry[];
}
