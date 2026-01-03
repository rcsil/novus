import { useState, useEffect } from 'react';
import { IconSearch, IconRefresh } from '@tabler/icons-react';

export default function Routes({ laravel }: { laravel: any }) {
	const [filter, setFilter] = useState('');

	useEffect(() => {
		laravel.fetchRoutes();
	}, []);

	const filteredRoutes = laravel.routes.filter((r: any) =>
		r.uri.toLowerCase().includes(filter.toLowerCase()) ||
		r.method.toLowerCase().includes(filter.toLowerCase()) ||
		(r.name && r.name.toLowerCase().includes(filter.toLowerCase()))
	);

	return (
		<div className="flex flex-col h-full">
			<div className="p-4 border-b border-[#2b2b2b] flex items-center justify-between">
				<div className="relative w-96">
					<IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
					<input
						type="text"
						placeholder="Search routes (uri, method, name)..."
						className="w-full bg-[#1e1e1e] border border-[#3e3e3e] rounded-md py-1.5 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 placeholder-gray-600"
						value={filter}
						onChange={(e) => setFilter(e.target.value)}
					/>
				</div>
				<button
					onClick={() => laravel.fetchRoutes()}
					className="flex items-center gap-2 px-3 py-1.5 bg-[#3e3e3e] hover:bg-[#4e4e4e] text-white text-xs rounded transition-colors"
				>
					<IconRefresh size={14} className={laravel.loading ? 'animate-spin' : ''} />
					Refresh
				</button>
			</div>

			<div className="flex-1 overflow-auto">
				<table className="w-full text-left border-collapse">
					<thead className="bg-[#252526] sticky top-0 z-10">
						<tr>
							<th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-[#2b2b2b]">Method</th>
							<th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-[#2b2b2b]">URI</th>
							<th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-[#2b2b2b]">Name</th>
							<th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-[#2b2b2b]">Action</th>
							<th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-[#2b2b2b]">Middleware</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-[#2b2b2b]">
						{filteredRoutes.map((route: any, i: number) => (
							<tr key={i} className="hover:bg-[#2a2d2e] group transition-colors">
								<td className="px-6 py-3 whitespace-nowrap">
									<span className={`px-2 py-1 inline-flex text-[10px] leading-3 font-semibold rounded-full ${route.method.includes('GET') ? 'bg-blue-900/40 text-blue-400' :
											route.method.includes('POST') ? 'bg-green-900/40 text-green-400' :
												route.method.includes('DELETE') ? 'bg-red-900/40 text-red-400' :
													'bg-gray-700 text-gray-300'
										}`}>
										{route.method.split('|')[0]}
									</span>
								</td>
								<td className="px-6 py-3 text-sm text-gray-300 font-mono select-all">
									{route.uri}
								</td>
								<td className="px-6 py-3 text-sm text-gray-500">
									{route.name || '-'}
								</td>
								<td className="px-6 py-3 text-sm text-gray-400 truncate max-w-xs" title={route.action}>
									{route.action.split('\\').pop()}
								</td>
								<td className="px-6 py-3 text-sm text-gray-500 truncate max-w-xs" title={route.middleware.join(', ')}>
									{route.middleware.length > 0 ? route.middleware.join(', ') : '-'}
								</td>
							</tr>
						))}
					</tbody>
				</table>
				{filteredRoutes.length === 0 && !laravel.loading && (
					<div className="p-8 text-center text-gray-500 text-sm">
						No routes found matching your filter.
					</div>
				)}
			</div>
		</div>
	);
}
