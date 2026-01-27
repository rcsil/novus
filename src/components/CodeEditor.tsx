import { useRef } from "react";

interface CodeEditorProps {
  content: string;
  onChange: (newContent: string) => void;
  language?: string;
}

export default function CodeEditor({ content, onChange }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const lines = content.split("\n");
  const lineCount = lines.length;

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  return (
    <div className="flex h-full w-full bg-[#1F2937]/50 relative font-mono text-sm">
      <div
        ref={lineNumbersRef}
        className="h-full bg-[#1F2937]/50 border-r border-gray-700 text-gray-500 text-right select-none overflow-hidden pt-4 pb-4"
        style={{ minWidth: "3.5rem" }}
      >
        {Array.from({ length: lineCount }).map((_, i) => (
          <div key={i} className="px-3 leading-6">
            {i + 1}
          </div>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        className="flex-1 h-full bg-transparent text-gray-200 p-0 pl-2 pt-4 pb-4 outline-none resize-none leading-6 whitespace-pre scrollbar-thin"
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
      />
    </div>
  );
}