import { IconBrandLaravel, IconFolder, IconServer, IconClock } from '@tabler/icons-react';

export default function Overview({ laravel, rootPath }: { laravel: any, rootPath: string }) {
	const cards = [
		{
			title: 'Laravel Version',
			value: laravel.laravelVersion || 'Loading...',
			icon: IconBrandLaravel,
			color: 'text-laravel-red'
		},
		{
			title: 'Project Path',
			value: rootPath.split('/').pop(),
			subValue: rootPath,
			icon: IconFolder,
			color: 'text-blue-400'
		},
		{
			title: 'Environment',
			value: 'Local',
			icon: IconServer,
			color: 'text-green-400'
		},
		{
			title: 'Debug Mode',
			value: 'Enabled',
			icon: IconClock,
			color: 'text-yellow-400'
		}
	];

	return (
		<div className="p-8 overflow-y-auto h-full">
			<h1 className="text-2xl font-light text-white mb-6">Dashboard Overview</h1>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
				{cards.map((card, i) => (
					<div key={i} className="bg-gray-900/90 p-4 rounded-lg shadow-sm hover:border-gray-600 transition-colors">
						<div className="flex items-start justify-between">
							<div>
								<p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">{card.title}</p>
								<p className="text-white text-lg font-medium truncate" title={typeof card.value === 'string' ? card.value : ''}>{card.value}</p>
								{card.subValue && <p className="text-gray-500 text-xs truncate mt-1" title={card.subValue}>{card.subValue}</p>}
							</div>
							<card.icon className={card.color} size={24} stroke={1.5} />
						</div>
					</div>
				))}
			</div>{/*
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className="bg-gray-900/90 rounded-lg p-6">
					<h3 className="text-white font-medium mb-4 flex items-center gap-2">
						<IconBrandLaravel size={18} className="text-gray-400" />
						Recent Activity
					</h3>
					<div className="text-gray-500 text-sm text-center py-8">
						No recent activity recorded.
					</div>
				</div>

				<div className="bg-[#252526] rounded-lg border border-[#2b2b2b] p-6">
					<h3 className="text-white font-medium mb-4">System Status</h3>
					<div className="space-y-3">
						<div className="flex justify-between text-sm">
							<span className="text-gray-400">PHP Version</span>
							<span className="text-white font-mono">8.2.0</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-gray-400">Composer</span>
							<span className="text-white font-mono">2.5.5</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-gray-400">Node.js</span>
							<span className="text-white font-mono">v18.16.0</span>
						</div>
					</div>
				</div>
			</div>*/}
		</div>
	);
}
