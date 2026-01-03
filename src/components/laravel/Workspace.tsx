import { useEffect } from 'react';
import { useLaravel } from '../../hooks/useLaravel';
import Overview from './pages/Overview';
import Routes from './pages/Routes';
import Logs from './pages/Logs';

interface WorkspaceProps {
	rootPath: string;
	activeSection: string;
}

export default function LaravelWorkspace({ rootPath, activeSection }: WorkspaceProps) {
	const laravel = useLaravel(rootPath);

	useEffect(() => {
		if (laravel.isLaravel) {
			laravel.fetchVersion();
		}
	}, [laravel.isLaravel]);

	const renderContent = () => {
		switch (activeSection) {
			case 'overview':
				return <Overview laravel={laravel} rootPath={rootPath} />;
			case 'routes':
				return <Routes laravel={laravel} />;
			case 'logs':
				return <Logs laravel={laravel} />;
			default:
				return (
					<div className="flex items-center justify-center h-full text-gray-500">
						Section "{activeSection}" under construction.
					</div>
				);
		}
	};

	return (
		<div className="flex-1 overflow-hidden flex flex-col">
			{renderContent()}
		</div>
	);
}
