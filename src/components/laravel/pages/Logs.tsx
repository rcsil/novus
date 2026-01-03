import { useEffect, useRef } from 'react';
import { IconRefresh, IconDownload } from '@tabler/icons-react';

export default function Logs({ laravel }: { laravel: any }) {
	const logRef = useRef<HTMLPreElement>(null);

	useEffect(() => {
		laravel.fetchLogs();
	}, []);

	useEffect(() => {
		if (logRef.current) {
			logRef.current.scrollTop = logRef.current.scrollHeight;
		}
	}, [laravel.logs]);

	return (
		<div className="flex flex-col h-full">
			<div className="p-3 border-b border-[#2b2b2b] flex justify-between items-center">
				<div className="text-xs text-gray-400">
					<span className="font-semibold text-gray-300">storage/logs/laravel.log</span>
				</div>
				<div className="flex gap-2">
					<button
						onClick={() => laravel.fetchLogs()}
						className="p-1 hover:bg-[#3e3e3e] rounded text-gray-400 hover:text-white"
						title="Refresh Logs"
					>
						<IconRefresh size={16} />
					</button>
					<button
						className="p-1 hover:bg-[#3e3e3e] rounded text-gray-400 hover:text-white"
						title="Download"
					>
						<IconDownload size={16} />
					</button>
				</div>
			</div>
			<pre
				ref={logRef}
				className="flex-1 p-4 font-mono text-xs text-gray-300 whitespace-pre-wrap break-all overflow-y-auto custom-scrollbar leading-5"
			>
				{laravel.logs || <span className="text-gray-600 italic">Log file is empty or missing.</span>}
			</pre>
		</div>
	);
}
