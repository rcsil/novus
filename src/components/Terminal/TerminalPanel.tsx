import { useState } from "react";
import { IconPlus, IconX, IconTerminal2 } from "@tabler/icons-react";
import TerminalComponent from "./TerminalComponent";

interface TerminalPanelProps {
  height?: number;
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
}

export default function TerminalPanel({ isOpen }: TerminalPanelProps) {
  const [tabs, setTabs] = useState<string[]>(["1"]);
  const [activeTab, setActiveTab] = useState("1");

  const addTab = () => {
    const newId = String(Date.now());
    setTabs([...tabs, newId]);
    setActiveTab(newId);
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = tabs.filter(t => t !== id);
    if (newTabs.length > 0) {
      setTabs(newTabs);
      if (activeTab === id) {
        setActiveTab(newTabs[newTabs.length - 1]);
      }
    } else {
      setTabs([]);
    }
  };

  if (!isOpen) return null;

  if (tabs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0f1523] text-gray-500">
        <div className="p-4 bg-[#111827] rounded-lg border border-gray-800 flex flex-col items-center shadow-xl">
          <IconTerminal2 size={32} className="mb-3 text-gray-600" />
          <p className="text-sm font-medium text-gray-400 mb-4">No open terminals</p>
          <button
            onClick={addTab}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded transition-all shadow-lg shadow-blue-900/20"
          >
            <IconPlus size={14} />
            New Terminal
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-[#0f1523] h-full">
      <div className="flex items-center h-8 bg-[#0b101b] border-b border-gray-800 px-2 select-none shrink-0 gap-1">

        <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin flex-1">
          {tabs.map((tabId, index) => (
            <div
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={`
                flex items-center gap-2 px-3 py-1 rounded text-xs cursor-pointer transition-all min-w-25 max-w-37.5 group border border-transparent
                ${activeTab === tabId
                  ? "bg-[#1F2937] text-gray-100 border-gray-700/50 shadow-sm"
                  : "text-gray-500 hover:text-gray-300 hover:bg-[#1F2937]/50"}
                `}
            >
              <IconTerminal2 size={12} className={activeTab === tabId ? "text-blue-400" : "text-gray-600"} />
              <span className="flex-1 truncate font-medium">Bash {index + 1}</span>
              <button
                onClick={(e) => closeTab(tabId, e)}
                className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-0.5 rounded hover:bg-white/10 transition-all"
              >
                <IconX size={12} />
              </button>
            </div>
          ))}
        </div>
        <div className="w-px h-4 bg-gray-800 mx-1" />
        <button
          onClick={addTab}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-[#1F2937] rounded transition-all"
          title="New Terminal"
        >
          <IconPlus size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-hidden relative bg-[#0f1523]">
        {tabs.map((tabId) => (
          <TerminalComponent
            key={tabId}
            id={tabId}
            isActive={activeTab === tabId}
          />
        ))}
      </div>
    </div>
  );
}