import { FileEntry } from '../../types/FileSystem';
import FileTreeItem from '../ui/FileTreeItem';

interface SidebarProps {
	files: FileEntry[];
	rootPath: string | null;
	onOpenFile: (path: string) => void;
	activeFilePath?: string;
}

export default function Sidebar({ files, rootPath, onOpenFile, activeFilePath }: SidebarProps) {
	const projectName = rootPath ? rootPath.split(/[\/]/).pop()?.toUpperCase() : 'NO FOLDER OPENED';

	return (
		<div className="w-64 h-full border-r border-[#2b2b2b] flex flex-col select-none">
			<div className="px-5 py-3 text-xs font-medium text-gray-400 tracking-wider flex justify-between items-center">
				<span>EXPLORER</span>
			</div>
			{rootPath ? (
				<div className="flex-1 overflow-y-auto custom-scrollbar">
					<div className="px-0">
						<div className="group flex items-center px-2 py-1 text-xs font-bold text-gray-300 hover:bg-[#2a2d2e] cursor-pointer mb-1">
							<span className="truncate" title={rootPath}>{projectName}</span>
						</div>
						<div>
							{files.map(file => (
								<FileTreeItem
									key={file.path}
									entry={file}
									onOpenFile={onOpenFile}
									activeFilePath={activeFilePath}
								/>
							))}
						</div>
					</div>
				</div>
			) : (
				<div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-sm p-4 text-center">
					<p className="mb-2">You have not yet opened a folder.</p>
				</div>
			)}
		</div>
	);
}
