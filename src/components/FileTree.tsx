import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { IconFolder, IconFolderOpen, IconFile, IconChevronRight, IconChevronDown, IconBrandPhp, IconBrandTypescript, IconBrandJavascript, IconBrandCss3, IconBrandHtml5, IconJson, IconEdit } from "@tabler/icons-react";
import Dropdown, { DropdownItem } from "./ui/Dropdown";

interface FileTreeProps {
	path: string;
	onFileSelect: (path: string) => void;
	onFileRename?: (oldPath: string, newPath: string) => void;
}

interface FileEntry {
	name: string;
	path: string;
	is_directory: boolean;
}

export default function FileTree({ path, onFileSelect, onFileRename }: FileTreeProps) {
	const [entries, setEntries] = useState<FileEntry[]>([]);
	const [loaded, setLoaded] = useState(false);
	const [refreshTrigger, setRefreshTrigger] = useState(0);

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

	useEffect(() => {
		if (path) {
			loadRoot();
		}
	}, [path, refreshTrigger]);

	const handleRenameComplete = (oldPath: string, newPath: string) => {
		setRefreshTrigger(prev => prev + 1);
		if (onFileRename) {
			onFileRename(oldPath, newPath);
		}
	};

	if (!loaded) return <div className="text-gray-500 text-xs px-4 py-2">Loading...</div>;

	return (
		<div className="select-none text-sm font-medium h-full pb-10">
			{entries.map((entry) => (
				<FileTreeItem
					key={entry.path}
					entry={entry}
					onFileSelect={onFileSelect}
					level={0}
					onRenameComplete={handleRenameComplete}
					refreshTrigger={refreshTrigger}
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

function FileTreeItem({ entry, onFileSelect, level, onRenameComplete, refreshTrigger }: { 
	entry: FileEntry, 
	onFileSelect: (p: string) => void, 
	level: number, 
	onRenameComplete: (oldPath: string, newPath: string) => void,
	refreshTrigger: number
}) {
	const [isOpen, setIsOpen] = useState(false);
	const [children, setChildren] = useState<FileEntry[]>([]);
	const [isLoaded, setIsLoaded] = useState(false);
	const [contextMenu, setContextMenu] = useState<{x: number, y: number} | null>(null);
	
	// Inline Rename State
	const [isRenaming, setIsRenaming] = useState(false);
	const [renameValue, setRenameValue] = useState(entry.name);
	const inputRef = useRef<HTMLInputElement>(null);

	const loadChildren = async () => {
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
	};

	useEffect(() => {
		if (isOpen && entry.is_directory) {
			loadChildren();
		}
	}, [refreshTrigger]);

	// Focus input when renaming starts
	useEffect(() => {
		if (isRenaming && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [isRenaming]);

	const handleClick = async (e: React.MouseEvent) => {
		e.stopPropagation();
		if (entry.is_directory) {
			if (!isOpen && !isLoaded) {
				await loadChildren();
			}
			setIsOpen(!isOpen);
		} else {
			onFileSelect(entry.path);
		}
	};

	const handleContextMenu = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setContextMenu({ x: e.clientX, y: e.clientY });
	};

	useEffect(() => {
		const handleClickOutside = () => setContextMenu(null);
		window.addEventListener('click', handleClickOutside);
		return () => window.removeEventListener('click', handleClickOutside);
	}, []);

	const handleRenameSubmit = async () => {
		if (!renameValue || renameValue.trim() === "" || renameValue === entry.name) {
			setIsRenaming(false);
			setRenameValue(entry.name);
			return;
		}

		try {
			await invoke("rename_file", { path: entry.path, newName: renameValue });
			
			// Calculate new path manually (simple implementation)
			// Assuming backend success, we construct the new path locally for the callback
			// In a more robust system, the backend might return the new path
			const parentPath = entry.path.substring(0, entry.path.lastIndexOf(entry.name)); // Keep trailing separator if any, or just ensure we join correctly
            // Handling path separators safely is tricky in JS without `path` module. 
            // Assuming the existing path separator style.
            const separator = entry.path.includes('\\') ? '\\' : '/';
            // Clean logic:
            const lastSeparatorIndex = Math.max(entry.path.lastIndexOf('/'), entry.path.lastIndexOf('\\'));
            const parent = entry.path.substring(0, lastSeparatorIndex);
            const newPath = `${parent}${separator}${renameValue}`;

			setIsRenaming(false);
			onRenameComplete(entry.path, newPath);
		} catch (error) {
			console.error("Failed to rename:", error);
			alert(`Failed to rename: ${error}`);
			setIsRenaming(false);
			setRenameValue(entry.name);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (isRenaming) {
			if (e.key === 'Enter') {
				e.stopPropagation();
				handleRenameSubmit();
			} else if (e.key === 'Escape') {
				e.stopPropagation();
				setIsRenaming(false);
				setRenameValue(entry.name);
			}
		} else {
			if (e.key === 'F2') {
				e.preventDefault();
				e.stopPropagation();
				setIsRenaming(true);
			}
		}
	};

	return (
		<div onContextMenu={handleContextMenu} className="relative">
			<div
				tabIndex={0}
				className={`flex items-center py-1 cursor-pointer hover:bg-[#1F2937] focus:bg-[#1F2937] text-gray-400 hover:text-gray-100 focus:text-gray-100 transition-colors whitespace-nowrap outline-none group`}
				style={{ paddingLeft: `${level * 12 + 4}px` }}
				onClick={handleClick}
				onKeyDown={handleKeyDown}
			>
				<span className="mr-1 opacity-70 min-w-4 flex justify-center">
					{entry.is_directory ? (
						isOpen ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />
					) : <div className="w-3.5" />}
				</span>

				<span className="mr-2 flex items-center">
					{entry.is_directory ? (
						isOpen ? <IconFolderOpen size={16} className="text-[#FF2D20]" /> : <IconFolder size={16} className="text-[#FF2D20] opacity-80" />
					) : (
						getFileIcon(entry.name)
					)}
				</span>
				
				{isRenaming ? (
					<input
						ref={inputRef}
						type="text"
						value={renameValue}
						onChange={(e) => setRenameValue(e.target.value)}
						onBlur={handleRenameSubmit}
						onClick={(e) => e.stopPropagation()}
						className="bg-[#111827] text-gray-100 border border-blue-500 rounded px-1 py-0.5 text-xs outline-none w-full mr-2"
					/>
				) : (
					<span className="truncate">{entry.name}</span>
				)}
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
								onRenameComplete={onRenameComplete}
								refreshTrigger={refreshTrigger}
							/>
						))
					)}
				</div>
			)}

			{contextMenu && (
				<div 
					className="fixed z-50"
					style={{ top: contextMenu.y, left: contextMenu.x }}
					onClick={(e) => e.stopPropagation()}
				>
					<Dropdown>
						<DropdownItem 
							label="Rename" 
							shortcut="F2" 
							onClick={() => {
								setIsRenaming(true);
								setContextMenu(null);
							}} 
						/>
					</Dropdown>
				</div>
			)}
		</div>
	)
}
