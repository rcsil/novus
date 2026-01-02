import { IconX } from "@tabler/icons-react";
import { TabBarProps } from "../../types/components/layouts/TabBar";

export default function TabBar({ tabs, onTabClick, onTabClose }: TabBarProps) {
  return (
    <div className="flex h-9 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`
            group flex items-center min-w-30 max-w-50 px-3 bg-gray-600 hover:bg-gray-700 cursor-pointer select-none text-white
            ${tab.isActive ? 'text-white bg-gray-900 hover:bg-gray-900  border-t border-t-laravel-red' : ''}
          `}
          onClick={() => onTabClick(tab.id)}
        >
          <span className={`flex-1 text-sm truncate mr-2 ${tab.isDirty ? 'italic' : ''}`}>
            {tab.name}
          </span>
          <button
            className={`
              p-0.5 rounded-full hover:bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none flex items-center justify-center w-5 h-5
              ${tab.isDirty ? 'opacity-100' : ''}
            `}
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(tab.id);
            }}
          >
            {tab.isDirty ? (
              <div className="w-2 h-2 rounded-full bg-laravel-red group-hover:hidden" />
            ) : null}
            <IconX size={14} className={tab.isDirty ? "hidden group-hover:block" : ""} />
          </button>
        </div>
      ))}
    </div>
  );
}
