import { IconX, IconCircleFilled } from "@tabler/icons-react";
import { MouseEvent } from "react";

interface Tab {
  id: string;
  name: string;
  isDirty: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTabId: string | null;
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
}

export default function Tabs({ tabs, activeTabId, onTabSelect, onTabClose }: TabsProps) {
  return (
    <div className="flex bg-[#111827] overflow-x-auto scrollbar-thin select-none h-9 shrink-0 border-b border-[#111827]">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            onClick={() => onTabSelect(tab.id)}
            className={`
              group flex items-center gap-2 px-3 min-w-30 max-w-30 text-xs cursor-pointer border-r border-gray-800 transition-colors relative
              ${isActive ? "bg-[#1F2937] text-gray-100" : "bg-[#111827] text-gray-500 hover:bg-[#1f2937] hover:text-gray-300"}
            `}
          >
            {isActive && <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#FF2D20]" />}
            
            <span className="flex-1 truncate leading-9">{tab.name}</span>
            
            <button
              onClick={(e: MouseEvent) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              className={`
                p-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity
                ${tab.isDirty ? "opacity-100" : ""}
                hover:bg-gray-700
              `}
            >
              {tab.isDirty ? (
                <IconCircleFilled size={8} className="text-[#FF2D20] group-hover:hidden" />
              ) : null}
              <IconX 
                size={14} 
                className={`${tab.isDirty ? "hidden group-hover:block" : ""}`} 
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}
