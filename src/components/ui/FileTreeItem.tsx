import { useState } from 'react';
import { FileEntry } from '../../types/FileSystem';
import {
	IconChevronRight,
	IconChevronDown,
	IconFolder,
	IconFolderOpen,
	IconFile
} from '@tabler/icons-react';
import useFileSystem from '../../hooks/useFileSystem';

interface FileTreeItemProps {
	entry: FileEntry;
	level?: number;
	onOpenFile: (path: string) => void;
	activeFilePath?: string;
}

export default function FileTreeItem({ entry, level = 0, onOpenFile, activeFilePath }: FileTreeItemProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [children, setChildren] = useState<FileEntry[] | null>(entry.children || null);
	const [isLoading, setIsLoading] = useState(false);
	const { readDirectory } = useFileSystem();

	const handleToggle = async (e: React.MouseEvent) => {
		e.stopPropagation();

		if (!entry.is_dir) {
			onOpenFile(entry.path);
			return;
		}

		if (!isOpen && !children) {
			setIsLoading(true);
			try {
				const fetchedChildren = await readDirectory(entry.path);
				setChildren(fetchedChildren);
			} catch (error) {
				console.error("Failed to load directory:", error);
			} finally {
				setIsLoading(false);
			}
		}

		setIsOpen(!isOpen);
	};

	const isActive = activeFilePath === entry.path;
	const paddingLeft = `${level * 12 + 12}px`;

	return (
		<div>
			<div
				className={`
					flex items-center py-1 px-2 cursor-pointer select-none
					hover:bg-[#2a2d2e] 
					${isActive ? 'bg-[#37373d] text-white' : 'text-gray-400'}
				`}
				style={{ paddingLeft }}
				onClick={handleToggle}
			>
				<div className="mr-1 opacity-80">
					{entry.is_dir ? (
						isOpen ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />
					) : (
						<div className="w-3.5" />
					)}
				</div>

				<div className="mr-1.5 text-laravel-red">
					{entry.is_dir ? (
						isOpen ? <IconFolderOpen size={16} /> : <IconFolder size={16} />
					) : (
						<span className="text-gray-400">
							<IconFile size={16} />
						</span>
					)}
				</div>
				<span className="truncate text-sm">{entry.name}</span>
			</div>
			{entry.is_dir && isOpen && (
				<div>
					{isLoading ? (
						<div className="text-xs text-gray-500 py-1" style={{ paddingLeft: `${(level + 1) * 12 + 12}px` }}>
							Loading...
						</div>
					) : children ? (
						children.map((child) => (
							<FileTreeItem
								key={child.path}
								entry={child}
								level={level + 1}
								onOpenFile={onOpenFile}
								activeFilePath={activeFilePath}
							/>
						))
					) : (
						<div className="text-xs text-gray-500 py-1" style={{ paddingLeft: `${(level + 1) * 12 + 12}px` }}>
							Empty
						</div>
					)}
				</div>
			)}
		</div>
	);
}
