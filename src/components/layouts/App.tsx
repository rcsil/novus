import { useState } from "react";
import TitleBar from "./TitleBar";
import Editor from "../Editor";
import TabBar from "./TabBar";
import Sidebar from "./Sidebar";
import ActivityBar from "./ActivityBar";
import useApp from "../../hooks/components/layouts/useApp";

function App() {
  const {
    files,
    activeFileId,
    activeFile,
    rootFolder,
    rootPath,
    setActiveFileId,
    handleNewFile,
    handleOpenFile,
    handleOpenFolder,
    handleSave,
    handleCloseTab,
    handleEditorChange
  } = useApp();

  const [activeView, setActiveView] = useState("explorer");
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const handleViewChange = (view: string) => {
    if (activeView === view) {
      setIsSidebarVisible(!isSidebarVisible);
    } else {
      setActiveView(view);
      setIsSidebarVisible(true);
    }
  };

  return (
    <div className="flex flex-col h-screen text-white overflow-hidden">
      <TitleBar
        onNewFile={handleNewFile}
        onOpenFile={() => handleOpenFile()}
        onOpenFolder={handleOpenFolder}
        onSave={handleSave}
      />
      <div className="flex flex-1 overflow-hidden">
        <ActivityBar activeView={isSidebarVisible ? activeView : ""} onViewChange={handleViewChange} />
        {isSidebarVisible && activeView === 'explorer' && (
          <Sidebar
            files={rootFolder}
            rootPath={rootPath}
            onOpenFile={(path) => handleOpenFile(path)}
            activeFilePath={activeFile?.path}
          />
        )}
        <div className="flex flex-col flex-1 min-w-0">
          <TabBar
            tabs={files.map(f => ({ id: f.id, name: f.name, isActive: f.id === activeFileId, isDirty: f.isDirty }))}
            onTabClick={setActiveFileId}
            onTabClose={handleCloseTab}
          />
          <main className="flex-1 overflow-hidden relative">
            {activeFile ? (
              <Editor
                code={activeFile.content}
                path={activeFile.path}
                onChange={handleEditorChange}
                language="php"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <p className="mb-2">No open files</p>
                  <p className="text-xs">Use File &gt; New File or File &gt; Open File</p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
