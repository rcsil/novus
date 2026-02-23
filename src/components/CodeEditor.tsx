import { useEffect, useRef } from "react";

interface CodeEditorProps {
  content: string;
  onChange: (newContent: string) => void;
  language?: string;
}

type EditKind = "insert" | "delete" | "other";

export default function CodeEditor({ content, onChange }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const INDENT = "    ";
  const MAX_UNDO_STEPS = 300;
  const UNDO_GROUP_WINDOW_MS = 900;
  const undoStackRef = useRef<string[]>([]);
  const redoStackRef = useRef<string[]>([]);
  const lastContentRef = useRef(content);
  const applyingHistoryRef = useRef(false);
  const pendingEditKindRef = useRef<EditKind>("other");
  const pendingEditAtRef = useRef(0);
  const undoGroupRef = useRef<{ active: boolean; kind: EditKind; lastAt: number }>({
    active: false,
    kind: "other",
    lastAt: 0,
  });

  const lines = content.split("\n");
  const lineCount = lines.length;

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const setSelection = (start: number, end = start) => {
    window.requestAnimationFrame(() => {
      if (!textareaRef.current) return;
      textareaRef.current.selectionStart = start;
      textareaRef.current.selectionEnd = end;
    });
  };

  const markEditIntent = (kind: EditKind) => {
    pendingEditKindRef.current = kind;
    pendingEditAtRef.current = Date.now();
  };

  const resetUndoGrouping = () => {
    pendingEditKindRef.current = "other";
    pendingEditAtRef.current = 0;
    undoGroupRef.current = { active: false, kind: "other", lastAt: 0 };
  };

  const handleBeforeInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const inputEvent = e.nativeEvent as InputEvent;
    const inputType = inputEvent.inputType ?? "";

    if (inputType.startsWith("insert")) {
      markEditIntent("insert");
    } else if (inputType.startsWith("delete")) {
      markEditIntent("delete");
    } else {
      markEditIntent("other");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const key = e.key.toLowerCase();
    const modifierPressed = e.ctrlKey || e.metaKey;

    if (!modifierPressed && (e.key.length === 1 || e.key === "Enter")) {
      markEditIntent("insert");
    } else if (e.key === "Backspace" || e.key === "Delete") {
      markEditIntent("delete");
    } else if (modifierPressed && key === "v") {
      markEditIntent("insert");
    } else if (modifierPressed && key === "x") {
      markEditIntent("delete");
    }

    if (modifierPressed && key === "z" && !e.shiftKey) {
      e.preventDefault();
      const previous = undoStackRef.current.pop();
      if (previous === undefined) return;
      redoStackRef.current.push(content);
      resetUndoGrouping();
      applyingHistoryRef.current = true;
      lastContentRef.current = previous;
      onChange(previous);
      return;
    }

    if (modifierPressed && (key === "y" || (key === "z" && e.shiftKey))) {
      e.preventDefault();
      const next = redoStackRef.current.pop();
      if (next === undefined) return;
      undoStackRef.current.push(content);
      resetUndoGrouping();
      applyingHistoryRef.current = true;
      lastContentRef.current = next;
      onChange(next);
      return;
    }

    if (e.key !== "Tab") return;
    e.preventDefault();
    markEditIntent("other");

    const start = e.currentTarget.selectionStart;
    const end = e.currentTarget.selectionEnd;
    const hasSelection = start !== end;

    if (!e.shiftKey) {
      if (!hasSelection) {
        const newValue = `${content.slice(0, start)}${INDENT}${content.slice(end)}`;
        onChange(newValue);
        setSelection(start + INDENT.length);
        return;
      }

      const blockStart = content.lastIndexOf("\n", start - 1) + 1;
      const lineEndIndex = content.indexOf("\n", end);
      const blockEnd = lineEndIndex === -1 ? content.length : lineEndIndex;
      const block = content.slice(blockStart, blockEnd);
      const lineCount = block.split("\n").length;
      const indentedBlock = block
        .split("\n")
        .map((line) => `${INDENT}${line}`)
        .join("\n");

      const newValue = `${content.slice(0, blockStart)}${indentedBlock}${content.slice(blockEnd)}`;
      onChange(newValue);
      setSelection(start + INDENT.length, end + INDENT.length * lineCount);
      return;
    }

    if (!hasSelection) {
      const lineStart = content.lastIndexOf("\n", start - 1) + 1;
      const line = content.slice(lineStart);
      const removableIndent = line.startsWith(INDENT)
        ? INDENT.length
        : Math.min((line.match(/^[ \t]+/)?.[0].length ?? 0), INDENT.length);

      if (removableIndent === 0) return;

      const newValue = `${content.slice(0, lineStart)}${content.slice(lineStart + removableIndent)}`;
      onChange(newValue);
      const newCursor = Math.max(lineStart, start - removableIndent);
      setSelection(newCursor);
      return;
    }

    const blockStart = content.lastIndexOf("\n", start - 1) + 1;
    const lineEndIndex = content.indexOf("\n", end);
    const blockEnd = lineEndIndex === -1 ? content.length : lineEndIndex;
    const lines = content.slice(blockStart, blockEnd).split("\n");

    let removedFromFirstLine = 0;
    let removedTotal = 0;

    const outdentedBlock = lines
      .map((line, index) => {
        const removableIndent = line.startsWith(INDENT)
          ? INDENT.length
          : Math.min((line.match(/^[ \t]+/)?.[0].length ?? 0), INDENT.length);

        if (index === 0) {
          removedFromFirstLine = removableIndent;
        }
        removedTotal += removableIndent;

        return line.slice(removableIndent);
      })
      .join("\n");

    const newValue = `${content.slice(0, blockStart)}${outdentedBlock}${content.slice(blockEnd)}`;
    onChange(newValue);

    const newStart = Math.max(blockStart, start - removedFromFirstLine);
    const newEnd = Math.max(newStart, end - removedTotal);
    setSelection(newStart, newEnd);
  };

  useEffect(() => {
    if (content === lastContentRef.current) return;

    if (applyingHistoryRef.current) {
      applyingHistoryRef.current = false;
      lastContentRef.current = content;
      resetUndoGrouping();
      return;
    }

    const now = Date.now();
    const editKind =
      now - pendingEditAtRef.current <= UNDO_GROUP_WINDOW_MS
        ? pendingEditKindRef.current
        : "other";

    const canMergeWithPrevious =
      undoGroupRef.current.active &&
      (editKind === "insert" || editKind === "delete") &&
      undoGroupRef.current.kind === editKind &&
      now - undoGroupRef.current.lastAt <= UNDO_GROUP_WINDOW_MS;

    if (!canMergeWithPrevious) {
      undoStackRef.current.push(lastContentRef.current);
      if (undoStackRef.current.length > MAX_UNDO_STEPS) {
        undoStackRef.current.shift();
      }
    }

    undoGroupRef.current = { active: true, kind: editKind, lastAt: now };
    redoStackRef.current = [];
    lastContentRef.current = content;
  }, [content]);

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
        onBeforeInput={handleBeforeInput}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
      />
    </div>
  );
}
