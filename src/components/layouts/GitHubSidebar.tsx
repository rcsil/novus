import { useState, useEffect } from 'react';
import { useGitHub, GitHubRepo } from '../../hooks/useGitHub';
import { IconBrandGithub, IconDownload, IconRefresh, IconLogout, IconGitBranch, IconArrowUp, IconArrowDown, IconPlus } from '@tabler/icons-react';
import { open } from '@tauri-apps/plugin-dialog';

interface GitHubSidebarProps {
    rootPath: string | null;
    onOpenFolder: (path: string) => void;
}

export default function GitHubSidebar({ rootPath, onOpenFolder }: GitHubSidebarProps) {
    const { token, repos, loading, deviceCodeData, startAuth, logout, clone, status, getStatus, branches, createBranch, switchBranch, pull, push } = useGitHub();
    const [view, setView] = useState<'repos' | 'status'>('repos');
    const [newBranchName, setNewBranchName] = useState('');

    useEffect(() => {
        if (rootPath) {
            getStatus(rootPath);
            setView('status');
        } else {
            setView('repos');
        }
    }, [rootPath]);

    const handleClone = async (repo: GitHubRepo) => {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: `Select location to clone ${repo.name}`
            });

            if (selected) {
                const parentPath = selected as string; 
                const separator = parentPath.includes('\\') ? '\\' : '/';
                const targetPath = `${parentPath}${separator}${repo.name}`;
                
                await clone(repo.clone_url, targetPath);
                onOpenFolder(targetPath);
            }
        } catch (e) {
            console.error("Clone failed", e);
            alert("Clone failed: " + e);
        }
    };

    const handleCreateBranch = async () => {
        if (!rootPath || !newBranchName) return;
        try {
            await createBranch(rootPath, newBranchName);
            setNewBranchName('');
        } catch (e) {
            alert("Failed to create branch: " + e);
        }
    };

    if (!token) {
        return (
            <div className="w-64 h-full border-r border-[#2b2b2b] flex flex-col p-4 items-center justify-center text-center">
                <IconBrandGithub size={48} className="mb-4 text-gray-400" />
                <h3 className="text-lg font-bold mb-2">GitHub Integration</h3>
                <p className="text-xs text-gray-500 mb-4">Sign in to access your repositories and manage your code.</p>
                
                {!deviceCodeData ? (
                    <button 
                        onClick={startAuth}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm w-full flex items-center justify-center"
                    >
                        {loading ? 'Loading...' : 'Sign in with GitHub'}
                    </button>
                ) : (
                    <div className="text-sm bg-[#2a2d2e] p-3 rounded w-full">
                        <p className="mb-2">1. Copy code: <strong className="text-white select-all">{deviceCodeData.user_code}</strong></p>
                        <p className="mb-2">2. Go to: <a href={deviceCodeData.verification_uri} target="_blank" className="text-blue-400 underline">{deviceCodeData.verification_uri}</a></p>
                        <p className="text-xs text-gray-500 mt-2">Waiting for authentication...</p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="w-64 h-full border-r border-[#2b2b2b] flex flex-col select-none">
            <div className="px-5 py-3 text-xs font-medium text-gray-400 tracking-wider flex justify-between items-center">
                <span>GITHUB</span>
                <div className="flex gap-2">
                    <button onClick={() => setView(view === 'repos' ? 'status' : 'repos')} title="Switch View">
                        {view === 'repos' ? <IconGitBranch size={14} /> : <IconBrandGithub size={14} />}
                    </button>
                    <button onClick={logout} title="Sign Out">
                        <IconLogout size={14} />
                    </button>
                </div>
            </div>

            {view === 'status' && rootPath ? (
                 <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="px-3 py-2">
                        {/* Actions */}
                        <div className="flex gap-2 mb-4">
                            <button onClick={() => pull(rootPath)} className="flex-1 bg-[#2a2d2e] hover:bg-[#3a3d3e] text-xs py-1 rounded flex items-center justify-center gap-1">
                                <IconArrowDown size={12} /> Pull
                            </button>
                            <button onClick={() => push(rootPath)} className="flex-1 bg-[#2a2d2e] hover:bg-[#3a3d3e] text-xs py-1 rounded flex items-center justify-center gap-1">
                                <IconArrowUp size={12} /> Push
                            </button>
                        </div>

                        {/* Branches */}
                        <div className="mb-4">
                            <h4 className="text-xs font-bold text-gray-300 mb-2 uppercase">Branches</h4>
                            <select 
                                className="w-full bg-[#1e1e1e] border border-[#3e3e3e] text-xs text-gray-300 rounded p-1 mb-2 outline-none"
                                onChange={(e) => switchBranch(rootPath, e.target.value)}
                            >
                                <option value="" disabled selected>Switch branch...</option>
                                {branches.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                            <div className="flex gap-1">
                                <input 
                                    type="text" 
                                    placeholder="New branch name" 
                                    className="flex-1 bg-[#1e1e1e] border border-[#3e3e3e] text-xs text-gray-300 rounded p-1 outline-none"
                                    value={newBranchName}
                                    onChange={(e) => setNewBranchName(e.target.value)}
                                />
                                <button onClick={handleCreateBranch} className="bg-[#2a2d2e] hover:bg-[#3a3d3e] px-2 rounded">
                                    <IconPlus size={12} />
                                </button>
                            </div>
                        </div>

                        <h4 className="text-xs font-bold text-gray-300 mb-2 uppercase">Changes</h4>
                        {status.length === 0 ? (
                            <div className="text-gray-500 text-xs italic">No changes or not a git repo</div>
                        ) : (
                            status.map((s, i) => (
                                <div key={i} className="text-xs text-gray-300 py-1 flex gap-2">
                                    <span className="text-yellow-500">M</span> {/* Simplified status icon */}
                                    <span className="truncate">{s}</span>
                                </div>
                            ))
                        )}
                         <button 
                            onClick={() => getStatus(rootPath)}
                            className="mt-4 flex items-center gap-1 text-xs text-blue-400 hover:underline"
                        >
                            <IconRefresh size={12} /> Refresh
                        </button>
                    </div>
                 </div>
            ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                     <div className="px-3 py-2">
                         <div className="flex justify-between items-center mb-2">
                            <h4 className="text-xs font-bold text-gray-300 uppercase">Repositories</h4>
                            <button onClick={() => token && useGitHub().startAuth} className="text-gray-500 hover:text-white">
                                <IconRefresh size={12} />
                            </button>
                         </div>
                        
                        {repos.map(repo => (
                            <div key={repo.id} className="group flex items-center justify-between px-2 py-2 text-xs text-gray-300 hover:bg-[#2a2d2e] rounded mb-1">
                                <div className="flex flex-col overflow-hidden">
                                    <span className="font-bold truncate">{repo.name}</span>
                                    <span className="text-gray-500 truncate text-[10px]">{repo.full_name}</span>
                                </div>
                                <button 
                                    onClick={() => handleClone(repo)}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#3a3d3e] rounded"
                                    title="Clone"
                                >
                                    <IconDownload size={14} />
                                </button>
                            </div>
                        ))}
                     </div>
                </div>
            )}
        </div>
    );
}

