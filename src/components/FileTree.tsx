import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { IconFolder, IconFolderOpen, IconFile, IconChevronRight, IconChevronDown, IconBrandPhp, IconBrandTypescript, IconBrandJavascript, IconBrandCss3, IconBrandHtml5, IconJson } from "@tabler/icons-react";

interface FileTreeProps {
	path: string;
	onFileSelect: (path: string) => void;
}

interface FileEntry {
	name: string;
	path: string;
	is_directory: boolean;
}

export default function FileTree({ path, onFileSelect }: FileTreeProps) {
	const [entries, setEntries] = useState<FileEntry[]>([]);
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		async function loadRoot() {
			try {
				const result = await invoke<FileEntry[]>("read_directory", { path });
				const sorted = result.sort((a, b) => {
					if (a.is_directory && !b.is_directory) return -1;
					if (!a.is_directory && b.is_directory) return 1;
					return a.name.localeCompare(b.name);
				});
				setEntries(sorted);
				setLoaded(true);
			} catch (error) {
				console.error("Failed to read root dir:", error);
			}
		}
		if (path) {
			loadRoot();
		}
	}, [path]);

	if (!loaded) return <div className="text-gray-500 text-xs px-4 py-2">Loading...</div>;

	return (
		<div className="select-none text-sm font-medium">
			{entries.map((entry) => (
				<FileTreeItem
					key={entry.path}
					entry={entry}
					onFileSelect={onFileSelect}
					level={0}
				/>
			))}
		</div>
	);
}

function getFileIcon(name: string) {
	if (name.endsWith('.php')) return <IconBrandPhp size={16} className="text-[#777BB4]" />;
	if (name.endsWith('.ts') || name.endsWith('.tsx')) return <IconBrandTypescript size={16} className="text-[#3178C6]" />;
	if (name.endsWith('.js') || name.endsWith('.jsx')) return <IconBrandJavascript size={16} className="text-[#F7DF1E]" />;
	if (name.endsWith('.css')) return <IconBrandCss3 size={16} className="text-[#264DE4]" />;
	if (name.endsWith('.html') || name.endsWith('.blade.php')) return <IconBrandHtml5 size={16} className="text-[#E34F26]" />;
	if (name.endsWith('.json')) return <IconJson size={16} className="text-yellow-500" />;
	return <IconFile size={16} className="text-gray-500" />;
}

function FileTreeItem({ entry, onFileSelect, level }: { entry: FileEntry, onFileSelect: (p: string) => void, level: number }) {
	const [isOpen, setIsOpen] = useState(false);
	const [children, setChildren] = useState<FileEntry[]>([]);
	const [isLoaded, setIsLoaded] = useState(false);

	const handleClick = async (e: React.MouseEvent) => {
		e.stopPropagation();
		if (entry.is_directory) {
			if (!isOpen && !isLoaded) {
				try {
					const result = await invoke<FileEntry[]>("read_directory", { path: entry.path });
					const sorted = result.sort((a, b) => {
						if (a.is_directory && !b.is_directory) return -1;
						if (!a.is_directory && b.is_directory) return 1;
						return a.name.localeCompare(b.name);
					});
					setChildren(sorted);
					setIsLoaded(true);
				} catch (e) {
					console.error("Error reading folder:", entry.path, e);
				}
			}
			setIsOpen(!isOpen);
		} else {
			onFileSelect(entry.path);
		}
	};

	return (
		<div>
			<div
				className={`flex items-center py-1 cursor-pointer hover:bg-[#1F2937] text-gray-400 hover:text-gray-100 transition-colors whitespace-nowrap`}
				style={{ paddingLeft: `${level * 12 + 4}px` }}
				onClick={handleClick}
			>
				<span className="mr-1 opacity-70 min-w-4 flex justify-center">
					{entry.is_directory ? (
						isOpen ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />
					) : <div className="w-3.5" />}
				</span>

				<span className={`mr-2 flex items-center`}>
					{entry.is_directory ? (
						isOpen ? <IconFolderOpen size={16} className="text-[#FF2D20]" /> : <IconFolder size={16} className="text-[#FF2D20] opacity-80" />
					) : (
						getFileIcon(entry.name)
					)}
				</span>
				<span className="truncate">{entry.name}</span>
			</div>

			{isOpen && entry.is_directory && (
				<div>
					{children.length === 0 && isLoaded ? (
						<div className="text-gray-600 italic text-xs py-1" style={{ paddingLeft: `${(level + 1) * 12 + 20}px` }}>Empty</div>
					) : (
						children.map(child => (
							<FileTreeItem
								key={child.path}
								entry={child}
								onFileSelect={onFileSelect}
								level={level + 1}
							/>
						))
					)}
				</div>
			)}
		</div>
	)
}
