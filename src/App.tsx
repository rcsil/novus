import { useState, useEffect, useCallback, useRef } from "react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from '@tauri-apps/api/core';
import { watch, type UnwatchFn, type WatchEvent } from "@tauri-apps/plugin-fs";
import AppHeader from "./components/layouts/app-header";
import CodeEditor from "./components/CodeEditor";
import FileTreeRoot from "./components/FileTree";
import Tabs from "./components/Tabs";
import TerminalPanel from "./components/Terminal/TerminalPanel";
import LaravelDashboard from "./components/Laravel/LaravelDashboard";
import ChatPanel from "./components/Chat/ChatPanel";
import { IconFolder, IconCode, IconTerminal2, IconChevronUp, IconChevronDown } from "@tabler/icons-react";
import ActivityBar from "./components/layouts/ActivityBar";
import SourceControlPanel from "./components/SourceControl/SourceControlPanel";
import DiffViewer from "./components/SourceControl/DiffViewer";

interface OpenFile {
  id: string;
  name: string;
  content: string;
  isDirty: boolean;
}

type ActivityBarView = "explorer" | "source-control" | "laravel" | "chat";

function isRelevantWatchEvent(eventType: WatchEvent["type"]) {
  if (eventType === "any") return true;
  if (eventType === "other") return false;
  return "create" in eventType || "modify" in eventType || "remove" in eventType;
}

export default function App() {
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [fileTreeRefreshTrigger, setFileTreeRefreshTrigger] = useState(0);
  const [sidebarWidth] = useState(300); // Increased slightly for Chat

  const [bottomPanelHeight, setBottomPanelHeight] = useState(250);
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(true);
  const [isResizingPanel, setIsResizingPanel] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState<"terminal">("terminal");
  const [activeView, setActiveView] = useState<ActivityBarView>("explorer");

  const stateRef = useRef({ openFiles, activeFileId });
  const fileTreeRefreshTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    stateRef.current = { openFiles, activeFileId };
  }, [openFiles, activeFileId]);

  const triggerFileTreeRefresh = useCallback(() => {
    if (fileTreeRefreshTimeoutRef.current !== null) {
      window.clearTimeout(fileTreeRefreshTimeoutRef.current);
    }

    fileTreeRefreshTimeoutRef.current = window.setTimeout(() => {
      setFileTreeRefreshTrigger(prev => prev + 1);
      fileTreeRefreshTimeoutRef.current = null;
    }, 150);
  }, []);

  const activeFile = openFiles.find(f => f.id === activeFileId);

  const handleOpenFile = useCallback(async () => {
    try {
      const selected = await open();

      if (selected && typeof selected === "string") {
        await openFile(selected);
      }
    } catch (err) {
      console.error("Failed to open file:", err);
    }
  }, [openFiles]);

  const openFile = async (path: string) => {
    const existing = openFiles.find(f => f.id === path);
    if (existing) {
      setActiveFileId(path);
      return;
    }
    try {
      const content = await invoke<string>('read_file_content', { path });
      const name = path.replace(/^.*[\\/]/, '');
      const newFile: OpenFile = { id: path, name, content, isDirty: false };
      setOpenFiles(prev => [...prev, newFile]);
      setActiveFileId(path);
    } catch (e) {
      console.error("Error reading file", e);
    }
  };

  const handleOpenDiff = async (filePath: string) => {
    if (!projectPath) return;
    
    const diffId = `diff://${filePath}`;
    const existing = openFiles.find(f => f.id === diffId);
    
    if (existing) {
      setActiveFileId(diffId);
      return;
    }

    try {
      const content = await invoke<string>('git_diff', { projectPath, filePath });
      const name = `${filePath} (Diff)`;
      const newFile: OpenFile = { id: diffId, name, content, isDirty: false };
      setOpenFiles(prev => [...prev, newFile]);
      setActiveFileId(diffId);
    } catch (e) {
      console.error("Error fetching diff", e);
    }
  };

  const handleOpenFolder = useCallback(async () => {
    try {
      const selected = await open({ directory: true, multiple: false, recursive: true });
      if (selected && typeof selected === "string") {
        await invoke("allow_project_directory_scope", { path: selected });
        setProjectPath(selected);
      }
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    if (!projectPath) return;

    let unwatch: UnwatchFn | null = null;
    let fallbackInterval: number | null = null;
    let disposed = false;

    const startPollingFallback = () => {
      if (fallbackInterval !== null) return;
      fallbackInterval = window.setInterval(() => {
        triggerFileTreeRefresh();
      }, 1500);
    };

    const startWatcher = async () => {
      try {
        await invoke("allow_project_directory_scope", { path: projectPath });

        const unwatchFn = await watch(
          projectPath,
          (event) => {
            if (isRelevantWatchEvent(event.type)) {
              triggerFileTreeRefresh();
            }
          },
          { recursive: true, delayMs: 180 }
        );

        if (disposed) {
          unwatchFn();
          return;
        }

        unwatch = unwatchFn;
      } catch (error) {
        console.error("Failed to watch project directory:", error);
        startPollingFallback();
      }
    };

    startWatcher();

    return () => {
      disposed = true;
      if (unwatch) {
        unwatch();
      }
      if (fallbackInterval !== null) {
        window.clearInterval(fallbackInterval);
      }
    };
  }, [projectPath, triggerFileTreeRefresh]);

  useEffect(() => {
    return () => {
      if (fileTreeRefreshTimeoutRef.current !== null) {
        window.clearTimeout(fileTreeRefreshTimeoutRef.current);
      }
    };
  }, []);

  const handleCloseTab = (id: string) => {
    setOpenFiles(prev => {
      const newFiles = prev.filter(f => f.id !== id);
      return newFiles;
    });
    if (activeFileId === id) {
      setOpenFiles(prev => {
        if (prev.length > 0) setActiveFileId(prev[prev.length - 1].id);
        else setActiveFileId(null);
        return prev;
      });
    }
  };

  const handleFileRename = (oldPath: string, newPath: string) => {
    setOpenFiles(prev => prev.map(f => {
      if (f.id === oldPath) {
        return {
          ...f,
          id: newPath,
          name: newPath.replace(/^.*[\\/]/, '')
        };
      }
      return f;
    }));
    
    if (activeFileId === oldPath) {
      setActiveFileId(newPath);
    }
  };

  const handleEditorChange = (newContent: string) => {
    if (!activeFileId) return;
    setOpenFiles(prev => prev.map(f => {
      if (f.id === activeFileId) return { ...f, content: newContent, isDirty: true };
      return f;
    }));
  };

  const handleSave = useCallback(async () => {
    const { openFiles, activeFileId } = stateRef.current;
    const activeFile = openFiles.find(f => f.id === activeFileId);
    if (!activeFile) return;

    try {
      await invoke('save_file', { path: activeFile.id, content: activeFile.content });
      setOpenFiles(prev => prev.map(f => {
        if (f.id === activeFile.id) return { ...f, isDirty: false };
        return f;
      }));
      triggerFileTreeRefresh();
    } catch (err) { console.error(err); }
  }, [triggerFileTreeRefresh]);

  const handleSaveAs = useCallback(async () => {
    const { openFiles, activeFileId } = stateRef.current;
    const activeFile = openFiles.find(f => f.id === activeFileId);
    if (!activeFile) return;

    try {
      const path = await save({
        filters: [{ name: "Text", extensions: ["txt", "js", "ts", "php", "html", "css", "json"] }],
      });
      if (path) {
        await invoke('save_file', { path, content: activeFile.content });
        setOpenFiles(prev => prev.map(f => {
          if (f.id === activeFile.id) return { ...f, id: path, name: path.replace(/^.*[\\/]/, ''), isDirty: false };
          return f;
        }));
        setActiveFileId(path);
        triggerFileTreeRefresh();
      }
    } catch (err) { console.error(err); }
  }, [triggerFileTreeRefresh]);

  const handleCloseApp = useCallback(async () => {
    await getCurrentWindow().close();
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingPanel(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingPanel) return;
      const newHeight = window.innerHeight - e.clientY - 24;
      if (newHeight > 100 && newHeight < window.innerHeight * 0.8) {
        setBottomPanelHeight(newHeight);
      }
    };
    const handleMouseUp = () => setIsResizingPanel(false);
    if (isResizingPanel) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingPanel]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "o") {
        e.preventDefault();
        e.shiftKey ? handleOpenFolder() : handleOpenFile();
      } else if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        e.shiftKey ? handleSaveAs() : handleSave();
      } else if (e.altKey && e.key === "F4") {
        e.preventDefault();
        handleCloseApp();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleOpenFile, handleOpenFolder, handleSave, handleSaveAs, handleCloseApp]);

  const isSidebarVisible = (projectPath && (activeView === 'explorer' || activeView === 'source-control')) || activeView === 'chat';

  return (
    <div className="flex flex-col h-screen bg-gray-800/95 text-white overflow-hidden">
      <AppHeader
        onOpen={handleOpenFile}
        onOpenFolder={handleOpenFolder}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onClose={handleCloseApp}
        fileName={activeFile ? activeFile.name : "Novus"}
        isDirty={activeFile?.isDirty}
      />
      <div className="flex-1 flex overflow-hidden">
        <ActivityBar activeView={activeView} onViewChange={setActiveView} />
        <div
          className="flex flex-col transition-all duration-300 ease-in-out bg-gray-900 rounded-xl mr-1 mb-1"
          style={{ width: isSidebarVisible ? sidebarWidth : 0, opacity: isSidebarVisible ? 1 : 0, overflow: "hidden" }}
        >
          {projectPath && activeView === 'explorer' && (
            <>
              <div className="h-8 shrink-0 flex items-center px-4 text-xs font-bold text-gray-500 uppercase tracking-wider bg-[#0f1523]/50">
                Explorer
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
                <div className="text-gray-300 font-bold px-2 py-1 mb-2 text-sm flex items-center gap-2">
                  <IconFolder size={16} className="text-[#FF2D20]" />
                  <span className="truncate">{projectPath.split(/[\\/]/).pop()}</span>
                </div>
                <FileTreeRoot
                  path={projectPath}
                  onFileSelect={(path) => openFile(path)}
                  onFileRename={handleFileRename}
                  refreshTrigger={fileTreeRefreshTrigger}
                />
              </div>
            </>
          )}
          {projectPath && activeView === 'source-control' && (
            <SourceControlPanel projectPath={projectPath} onOpenDiff={handleOpenDiff} />
          )}
          {activeView === 'chat' && (
            <ChatPanel activeFileContent={activeFile?.content} activeFileName={activeFile?.name} />
          )}
        </div>
        <main className="flex-1 relative flex flex-col min-w-0">
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeView === 'laravel' ? (
              <div className="flex-1 overflow-hidden h-full pr-1 pb-1">
                <LaravelDashboard 
                  projectPath={projectPath}
                  isOpen={true} 
                  onToggle={() => {}} 
                />
              </div>
            ) : (
              <>
                {openFiles.length > 0 ? (
                  <>
                    <Tabs
                      tabs={openFiles}
                      activeTabId={activeFileId}
                      onTabSelect={setActiveFileId}
                      onTabClose={handleCloseTab}
                    />
                    <div className="flex-1 overflow-hidden relative">
                      {activeFile ? (
                        activeFile.id.startsWith('diff://') ? (
                          <DiffViewer content={activeFile.content} />
                        ) : (
                          <CodeEditor
                            key={activeFile.id}
                            content={activeFile.content}
                            onChange={handleEditorChange}
                          />
                        )
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500">
                          <p>Select a file to view</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-600 select-none">
                    <IconCode size={48} className="mb-4 text-gray-700" />
                    <h2 className="text-lg font-medium text-gray-500 mb-2">Welcome to Novus</h2>
                    <p className="text-sm max-w-xs text-center leading-relaxed">
                      {!projectPath ? (
                        <>
                          Open a folder to start working on your <span className="text-[#FF2D20]">Laravel</span> project.
                          <br />
                          <span className="text-xs bg-gray-800 px-2 py-1 rounded mt-2 inline-block font-mono text-gray-400">Ctrl + Shift + O</span>
                        </>
                      ) : "No files open"}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {isBottomPanelOpen && (
            <div
              className="h-1 bg-[#111827]/50 hover:bg-[#FF2D20] cursor-row-resize transition-colors w-full shrink-0 z-20"
              onMouseDown={handleMouseDown}
            />
          )}

          <div className="bg-[#0f1523] border-t border-gray-800 flex flex-col shrink-0 transition-all duration-300 ease-out" style={{ height: isBottomPanelOpen ? bottomPanelHeight : 'auto' }}>
            <div className="flex items-center h-9 bg-[#0b101b] border-b border-gray-800 px-3 select-none shrink-0 gap-4">
              <div className="flex items-center gap-1">
                <PanelTab
                  active={activeBottomTab === "terminal" && isBottomPanelOpen}
                  onClick={() => { setActiveBottomTab("terminal"); setIsBottomPanelOpen(true); }}
                  icon={<IconTerminal2 size={14} />}
                  label="Terminal"
                />
              </div>

              <div className="flex-1" />

              <button
                onClick={() => setIsBottomPanelOpen(!isBottomPanelOpen)}
                className="text-gray-500 hover:text-gray-300 p-1.5 hover:bg-white/5 rounded transition-colors"
              >
                {isBottomPanelOpen ? <IconChevronDown size={14} /> : <IconChevronUp size={14} />}
              </button>
            </div>

            {isBottomPanelOpen && (
              <div className="flex-1 overflow-hidden relative bg-[#0f1523]">
                <div className={activeBottomTab === "terminal" ? "h-full w-full block" : "hidden"}>
                  <TerminalPanel isOpen={true} onToggle={() => { }} />
                </div>
              </div>
            )}
          </div>

        </main>
      </div>

      <div className="h-6 bg-[#0b101b] text-[11px] text-gray-500 flex items-center px-3 select-none border-t border-gray-800 shrink-0 z-10 font-medium">
        <div className="flex-1 truncate mr-4 flex items-center gap-3">
          <div className="flex items-center gap-1.5 hover:text-gray-300 transition-colors cursor-pointer">
            <IconCode size={12} className="text-blue-500" />
            <span>{activeFile ? activeFile.id.replace(projectPath || '', '') : "Ready"}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {activeFile?.isDirty && <span className="text-amber-500 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Unsaved</span>}
          <span className="hover:text-gray-300 cursor-pointer">UTF-8</span>
          <span className="hover:text-gray-300 cursor-pointer">TypeScript React</span>
        </div>
      </div>
    </div>
  );
}

function PanelTab({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all relative
        ${active ? "text-gray-100 bg-[#1F2937]" : "text-gray-500 hover:text-gray-300 hover:bg-[#1F2937]/50"}
    `}
    >
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3 bg-[#FF2D20] rounded-r-full" />}
      {icon}
      {label}
    </button>
  );
}
