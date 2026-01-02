import TitleBar from "./TitleBar";
import Editor from "../Editor";
import TabBar from "./TabBar";
import useApp from "../../hooks/components/layouts/useApp";

function App() {
  const {
    files,
    activeFileId,
    activeFile,
    setActiveFileId,
    handleNewFile,
    handleOpenFile,
    handleSave,
    handleCloseTab,
    handleEditorChange
  } = useApp();

  return (
    <div className="flex flex-col h-screen text-white overflow-hidden">
      <TitleBar onNewFile={handleNewFile} onOpenFile={handleOpenFile} onSave={handleSave} />
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
  );
}

export default App;