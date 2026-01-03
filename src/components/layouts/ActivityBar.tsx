import {
	IconFiles,
	IconTerminal2,
	IconBrandGithub,
	IconBrandLaravel
} from '@tabler/icons-react';

interface ActivityBarProps {
	activeView: string;
	onViewChange: (view: string) => void;
	onToggleTerminal?: () => void;
	isTerminalOpen?: boolean;
}

export default function ActivityBar({ activeView, onViewChange, onToggleTerminal, isTerminalOpen }: ActivityBarProps) {
	const topItems = [
		{ id: 'explorer', icon: IconFiles },
		{ id: 'github', icon: IconBrandGithub },
		{ id: 'laravel', icon: IconBrandLaravel },
	];

	return (
		<div className="w-12 h-full flex flex-col justify-between border-r border-gray-700/50 py-2 z-1">
			<div className="flex flex-col items-center gap-2">
				{topItems.map((item) => (
					<div
						key={item.id}
						className={`
							relative group w-12 h-12 flex items-center justify-center cursor-pointer
							${activeView === item.id ? 'text-white' : 'text-[#858585] hover:text-white'}
						`}
						onClick={() => onViewChange(item.id)}
					>
						{activeView === item.id && (
							<div className="absolute left-0 top-0 bottom-0 w-0.5 bg-laravel-red" />
						)}
						<item.icon stroke={1.5} size={24} />
					</div>
				))}
			</div>
			{onToggleTerminal && (
				<div className="flex flex-col items-center gap-2">
					<div
						className={`
							relative group w-12 h-12 flex items-center justify-center cursor-pointer
							${isTerminalOpen ? 'text-white' : 'text-[#858585] hover:text-white'}
						`}
						onClick={onToggleTerminal}
						title="Toggle Terminal (Ctrl+`)"
					>
						{isTerminalOpen && (
							<div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white" />
						)}
						<IconTerminal2 stroke={1.5} size={24} />
					</div>
				</div>
			)}
		</div>
	);
}
