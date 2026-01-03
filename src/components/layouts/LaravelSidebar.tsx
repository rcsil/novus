import { useState, useEffect } from 'react';
import { useLaravel } from '../../hooks/useLaravel';
import { IconRefresh, IconPlus, IconRoute, IconFileText, IconInfoCircle, IconBrandPhp } from '@tabler/icons-react';

interface LaravelSidebarProps {
    rootPath: string | null;
    onOpenFolder: () => void;
}

export default function LaravelSidebar({ rootPath, onOpenFolder }: LaravelSidebarProps) {
    const { isLaravel, routes, logs, loading, error, fetchRoutes, fetchLogs, createProject } = useLaravel(rootPath);
    const [activeTab, setActiveTab] = useState<'overview' | 'routes' | 'logs'>('overview');
    const [newProjectName, setNewProjectName] = useState('');
    const [routeFilter, setRouteFilter] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (isLaravel) {
            if (activeTab === 'routes') fetchRoutes();
            if (activeTab === 'logs') fetchLogs();
        }
    }, [isLaravel, activeTab]);

    const handleCreateProject = async () => {
        if (!newProjectName) return;
        try {
            setIsCreating(true);
            await createProject(newProjectName);
            setIsCreating(false);
            setNewProjectName('');
            // Prompt user to open the new folder? Or just refresh if we created in subfolder?
            // Usually composer create-project makes a new folder.
        } catch (e) {
            setIsCreating(false);
            console.error(e);
        }
    };

    const filteredRoutes = routes.filter(r => 
        r.uri.toLowerCase().includes(routeFilter.toLowerCase()) || 
        r.method.toLowerCase().includes(routeFilter.toLowerCase()) ||
        (r.name && r.name.toLowerCase().includes(routeFilter.toLowerCase()))
    );

    if (!rootPath) {
        return (
            <div className="w-64 h-full border-r border-[#2b2b2b] flex flex-col items-center justify-center text-gray-500 text-sm p-4 text-center">
                <p className="mb-2">Open a folder to get started.</p>
                <button onClick={onOpenFolder} className="text-blue-400 hover:text-blue-300">Open Folder</button>
            </div>
        );
    }

    if (!isLaravel) {
         return (
            <div className="w-64 h-full border-r border-[#2b2b2b] flex flex-col p-4">
                <div className="text-xs font-medium text-gray-400 tracking-wider mb-4 flex items-center gap-2">
                    <IconBrandPhp size={16} />
                    <span>LARAVEL</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-sm text-center">
                    <p className="mb-4">No Laravel project detected.</p>
                    
                    <div className="w-full bg-[#2a2d2e] p-3 rounded flex flex-col gap-2">
                        <span className="text-xs text-left font-bold text-gray-300">New Project</span>
                        <input 
                            type="text" 
                            placeholder="Project Name" 
                            className="bg-[#1e1e1e] border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                        />
                        <button 
                            onClick={handleCreateProject} 
                            disabled={isCreating || !newProjectName}
                            className="bg-laravel-red hover:bg-red-700 text-white text-xs py-1 rounded disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                            {isCreating ? <IconRefresh className="animate-spin" size={12}/> : <IconPlus size={12}/>}
                            Create Project
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-64 h-full border-r border-[#2b2b2b] flex flex-col bg-[#1e1e1e]">
             <div className="px-4 py-3 text-xs font-medium text-gray-400 tracking-wider flex justify-between items-center border-b border-[#2b2b2b]">
                <div className="flex items-center gap-2">
                     <IconBrandPhp size={16} className="text-laravel-red"/>
                     <span>LARAVEL</span>
                </div>
                <button onClick={() => {
                    if (activeTab === 'routes') fetchRoutes();
                    if (activeTab === 'logs') fetchLogs();
                }} className="hover:text-white" title="Refresh">
                    <IconRefresh size={14} className={loading ? 'animate-spin' : ''}/>
                </button>
            </div>

            <div className="flex items-center border-b border-[#2b2b2b]">
                {[ 
                    { id: 'overview', icon: IconInfoCircle, title: 'Overview' },
                    { id: 'routes', icon: IconRoute, title: 'Routes' },
                    { id: 'logs', icon: IconFileText, title: 'Logs' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 p-2 flex justify-center hover:bg-[#2a2d2e] ${activeTab === tab.id ? 'text-laravel-red border-b-2 border-laravel-red' : 'text-gray-500'}`}
                        title={tab.title}
                    >
                        <tab.icon size={18} />
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                {activeTab === 'overview' && (
                    <div className="p-4">
                        <div className="mb-4">
                            <h3 className="text-xs font-bold text-gray-300 uppercase mb-2">Project Info</h3>
                            <div className="text-xs text-gray-400">
                                <p>Path: <span className="text-gray-500 select-all">{rootPath}</span></p>
                                <p className="mt-2 text-green-500">Active</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'routes' && (
                    <div className="flex flex-col h-full">
                         <div className="p-2 border-b border-[#2b2b2b]">
                             <input 
                                 type="text" 
                                 placeholder="Filter routes..." 
                                 className="w-full bg-[#1e1e1e] border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                                 value={routeFilter}
                                 onChange={(e) => setRouteFilter(e.target.value)}
                             />
                         </div>
                         <div className="flex-1 overflow-y-auto custom-scrollbar">
                             {filteredRoutes.length === 0 && !loading && <div className="p-4 text-xs text-gray-500 text-center">No routes found.</div>}
                             {filteredRoutes.map((route, i) => (
                                 <div key={i} className="px-3 py-2 border-b border-[#2b2b2b] hover:bg-[#2a2d2e] cursor-default group">
                                     <div className="flex items-center gap-2 mb-1">
                                         <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                             route.method.includes('GET') ? 'bg-blue-900/50 text-blue-400' :
                                             route.method.includes('POST') ? 'bg-green-900/50 text-green-400' :
                                             'bg-gray-700 text-gray-300'
                                         }`}>{route.method.split('|')[0]}</span>
                                         <span className="text-xs text-gray-300 font-mono truncate" title={route.uri}>{route.uri}</span>
                                     </div>
                                     <div className="flex justify-between items-center">
                                         <span className="text-[10px] text-gray-500 truncate max-w-[150px]" title={route.action}>{route.action.split('\\').pop()}</span>
                                         <span className="text-[10px] text-gray-600 truncate max-w-[80px]" title={route.name || ''}>{route.name}</span>
                                     </div>
                                 </div>
                             ))}
                         </div>
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="h-full flex flex-col">
                        <pre className="flex-1 p-2 text-[10px] font-mono text-gray-400 whitespace-pre-wrap break-all overflow-y-auto custom-scrollbar">
                            {logs || "No logs available."} 
                        </pre>
                    </div>
                )}
                
                {error && (
                    <div className="p-4 text-xs text-red-400 border-t border-red-900/30 bg-red-900/10">
                        Error: {error}
                    </div>
                )}
            </div>
        </div>
    );
}
