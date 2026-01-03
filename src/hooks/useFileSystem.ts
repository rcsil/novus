import { invoke } from "@tauri-apps/api/core";
import { FileEntry } from "../types/FileSystem";

export default function useFileSystem() {
	const readDirectory = async (path: string): Promise<FileEntry[]> => {
		try {
			return await invoke("read_directory", { path });
		} catch (error) {
			console.error("Failed to read directory:", error);
			throw error;
		}
	};

	return {
		readDirectory,
	};
}
