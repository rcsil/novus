import {
	IconInfoCircle,
	IconRoute,
	IconFileText,
	IconDatabase,
	IconTerminal2,
	IconBrandLaravel
} from '@tabler/icons-react';

interface NavigationProps {
	activeSection: string;
	onSectionChange: (section: string) => void;
}

export default function LaravelNavigation({ activeSection, onSectionChange }: NavigationProps) {
	const items = [
		{ id: 'overview', icon: IconInfoCircle, label: 'Overview' },
		{ id: 'routes', icon: IconRoute, label: 'Routes' },
		{ id: 'logs', icon: IconFileText, label: 'Logs' },
		{ id: 'artisan', icon: IconTerminal2, label: 'Artisan' },
		{ id: 'database', icon: IconDatabase, label: 'Database' },
	];

	return (
		<div className="w-64 h-full border-r border-[#2b2b2b] flex flex-col">
			<div className="px-5 py-4 flex items-center gap-3 border-b border-[#2b2b2b] mb-2">
				<IconBrandLaravel size={24} className="text-laravel-red" />
				<span className="font-bold text-gray-200 tracking-wide text-sm">DASHBOARD</span>
			</div>

			<div className="flex-1 overflow-y-auto py-2">
				{items.map(item => (
					<button
						key={item.id}
						onClick={() => onSectionChange(item.id)}
						className={`
							w-full px-5 py-2.5 flex items-center gap-3 text-sm transition-colors
							${activeSection === item.id
							? 'text-white bg-gray-900/90 border-l-2 border-laravel-red'
							: 'text-gray-400 hover:text-white hover:bg-[#2a2d2e]/50 border-l-2 border-transparent'}
						`}
					>
						<item.icon size={18} stroke={1.5} />
						<span>{item.label}</span>
					</button>
				))}
			</div>
			<div className="p-4 border-t border-[#2b2b2b]">
				<div className="text-[10px] text-gray-600 text-center">
					LaraCode v0.1.0
				</div>
			</div>
		</div>
	);
}
