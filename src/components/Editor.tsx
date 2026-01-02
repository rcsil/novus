import { Editor as MonacoEditor } from "@monaco-editor/react";
import { EditorProps } from "../types/Editor";

export default function Editor({ code, onChange, language = "php", path }: EditorProps) {
  const handleEditorDidMount = (_: any, monaco: any) => {
    monaco.editor.defineTheme('transparent-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#101828',
      }
    });
    monaco.editor.setTheme('transparent-dark');
  };

  return (
    <div className="w-full h-full">
      <MonacoEditor
        height="100%"
        defaultLanguage="php"
        language={language}
        value={code}
        path={path}
        onChange={onChange}
        theme="transparent-dark"
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', monospace",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16 },
          tabSize: 4,
          insertSpaces: true,
        }}
      />
    </div>
  );
}
