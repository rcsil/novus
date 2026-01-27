import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { IconPlus, IconMinus, IconCheck, IconGitBranch } from '@tabler/icons-react';

interface SourceControlPanelProps {
  projectPath: string;
  onOpenDiff: (file: string) => void;
}

enum FileStatus {
    New,
    Modified,
    Deleted,
    Renamed,
}

interface GitFileStatus {
    path: string;
    status: FileStatus;
    is_staged: boolean;
}

interface GitBranch {
    name: string;
    current: boolean;
}

export default function SourceControlPanel({ projectPath, onOpenDiff }: SourceControlPanelProps) {
  const [files, setFiles] = useState<GitFileStatus[]>([]);
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [commitMessage, setCommitMessage] = useState('');

  const refreshStatus = () => {
    if (projectPath) {
      invoke<GitFileStatus[]>('git_status', { projectPath })
        .then(setFiles)
        .catch(console.error);
    }
  };

  const refreshBranches = () => {
    if (projectPath) {
      invoke<GitBranch[]>('git_branches', { projectPath })
        .then(setBranches)
        .catch(console.error);
    }
  };

  useEffect(() => {
    refreshStatus();
    refreshBranches();
  }, [projectPath]);

  const handleFileClick = (file: GitFileStatus) => {
    onOpenDiff(file.path);
  };

  const handleStage = (e: React.MouseEvent, file: GitFileStatus) => {
    e.stopPropagation();
    invoke('git_add', { projectPath, filePath: file.path })
      .then(refreshStatus)
      .catch(console.error);
  };

  const handleUnstage = (e: React.MouseEvent, file: GitFileStatus) => {
    e.stopPropagation();
    invoke('git_unstage', { projectPath, filePath: file.path })
      .then(refreshStatus)
      .catch(console.error);
  };

  const handleCommit = () => {
    if (!commitMessage || files.filter(f => f.is_staged).length === 0) return;
    invoke('git_commit', { projectPath, message: commitMessage })
      .then(() => {
        setCommitMessage('');
        refreshStatus();
      })
      .catch(console.error);
  };

  const handleCheckout = (branchName: string) => {
    invoke('git_checkout_branch', { projectPath, branchName })
      .then(() => {
        refreshBranches();
        refreshStatus();
      })
      .catch(console.error);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="h-8 shrink-0 flex items-center px-4 text-xs font-bold text-gray-500 uppercase tracking-wider bg-[#0f1523]/50">
        Source Control
      </div>
      <div className="flex-1 overflow-y-auto p-2 text-gray-400">
        
        <div className="mb-4">
            <h3 className="text-sm font-bold mb-2 flex items-center gap-1"><IconGitBranch size={14} /> Branches</h3>
            <div className="flex flex-col gap-1">
                {branches.map(branch => (
                    <div 
                        key={branch.name} 
                        onClick={() => !branch.current && handleCheckout(branch.name)}
                        className={`text-xs px-2 py-1 rounded cursor-pointer flex items-center justify-between ${branch.current ? 'bg-[#FF2D20]/20 text-[#FF2D20]' : 'hover:bg-gray-700'}`}
                    >
                        <span>{branch.name}</span>
                        {branch.current && <span className="text-[10px] font-bold">Current</span>}
                    </div>
                ))}
            </div>
        </div>

        <div className="mb-4">
          <div className="flex gap-2">
            <textarea
              className="w-full bg-[#111827] border border-gray-700 rounded p-2 text-xs text-gray-300 focus:outline-none focus:border-[#FF2D20] resize-none"
              placeholder="Commit message"
              rows={2}
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
            />
            <button
              onClick={handleCommit}
              disabled={!commitMessage || files.filter(f => f.is_staged).length === 0}
              className="bg-[#FF2D20] text-white p-2 rounded hover:bg-[#FF2D20]/90 disabled:opacity-50 disabled:cursor-not-allowed h-fit"
              title="Commit"
            >
              <IconCheck size={16} />
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold mb-2">Changes</h3>
          {files.filter(f => !f.is_staged).map(file => (
            <div key={file.path} onClick={() => handleFileClick(file)} className="flex items-center justify-between cursor-pointer hover:bg-gray-700 p-1 rounded group">
              <span className="truncate">{file.path}</span>
              <button onClick={(e) => handleStage(e, file)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-white transition-opacity" title="Stage Changes">
                <IconPlus size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <h3 className="text-sm font-bold mb-2">Staged Changes</h3>
          {files.filter(f => f.is_staged).map(file => (
            <div key={file.path} onClick={() => handleFileClick(file)} className="flex items-center justify-between cursor-pointer hover:bg-gray-700 p-1 rounded group">
              <span className="truncate">{file.path}</span>
              <button onClick={(e) => handleUnstage(e, file)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-white transition-opacity" title="Unstage Changes">
                <IconMinus size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
