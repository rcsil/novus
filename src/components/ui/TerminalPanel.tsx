import { useState } from "react";
import Terminal from "./Terminal";
import { Plus, X, ChevronDown } from "lucide-react";

interface TerminalSession {
  id: string;
  name: string;
}

interface TerminalPanelProps {
  onClose?: () => void;
}

export default function TerminalPanel({ onClose }: TerminalPanelProps) {
  const [terminals, setTerminals] = useState<TerminalSession[]>([
    { id: "term-1", name: "Terminal 1" },
  ]);
  const [activeTerminalId, setActiveTerminalId] = useState<string>("term-1");
  const [nextId, setNextId] = useState(2);

  const handleAddTerminal = () => {
    const newId = `term-${nextId}`;
    setTerminals((prev) => [...prev, { id: newId, name: `Terminal ${nextId}` }]);
    setActiveTerminalId(newId);
    setNextId((prev) => prev + 1);
  };

  const handleCloseTerminal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const newTerminals = terminals.filter((t) => t.id !== id);
    setTerminals(newTerminals);

    if (activeTerminalId === id) {
      if (newTerminals.length > 0) {
        setActiveTerminalId(newTerminals[newTerminals.length - 1].id);
      } else {
        setActiveTerminalId("");
      }
    }
  };

  if (terminals.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-400 bg-zinc-900 relative">
        <div className="absolute top-2 right-2">
          <button onClick={onClose} className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white">
            <ChevronDown size={16} />
          </button>
        </div>
        <p className="mb-2">No open terminals</p>
        <button
          onClick={handleAddTerminal}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
        >
          Open New Terminal
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-zinc-900">
      <div className="flex items-center bg-[#1e1e1e] border-b border-zinc-700 pr-2">
        <div className="flex-1 flex overflow-x-auto scrollbar-hide">
          {terminals.map((term) => (
            <div
              key={term.id}
              onClick={() => setActiveTerminalId(term.id)}
              className={`
                group flex items-center px-3 py-1.5 text-xs cursor-pointer border-r border-zinc-800 min-w-[120px] max-w-[200px] select-none
                ${activeTerminalId === term.id
                  ? "bg-zinc-800 text-white border-t-2 border-t-laravel-red"
                  : "bg-[#1e1e1e] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border-t-2 border-t-transparent"}
              `}
            >
              <span className="flex-1 truncate mr-2">{term.name}</span>
              <button
                onClick={(e) => handleCloseTerminal(term.id, e)}
                className={`p-0.5 rounded-sm hover:bg-zinc-600 ${activeTerminalId === term.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={handleAddTerminal}
          className="p-1.5 mx-1 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded"
          title="New Terminal"
        >
          <Plus size={14} />
        </button>
        <button
          onClick={onClose}
          className="p-1.5 ml-1 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded"
          title="Collapse Panel"
        >
          <ChevronDown size={14} />
        </button>
      </div>
      <div className="flex-1 relative overflow-hidden">
        {terminals.map((term) => (
          <div
            key={term.id}
            className="absolute inset-0"
            style={{
              visibility: activeTerminalId === term.id ? 'visible' : 'hidden',
              zIndex: activeTerminalId === term.id ? 10 : 0
            }}
          >
            <Terminal id={term.id} visible={activeTerminalId === term.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
