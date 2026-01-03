import { IconBrandLaravel, IconMinus, IconSquare, IconCopy, IconX } from "@tabler/icons-react";
import useTitleBar from "../../hooks/components/layouts/useTitleBar";
import MenuBar from "./MenuBar";
import { TitleBarProps } from "../../types/components/layouts/TitleBar";

export default function TitleBar({ onNewFile, onOpenFile, onOpenFolder, onSave }: TitleBarProps) {
  const { minimize, toggleMaximize, close, isMaximized } = useTitleBar();

  return (
    <header
      data-tauri-drag-region
      className="h-9 flex items-center justify-between border-b border-gray-700/50 select-none"
    >
      <div className="flex items-center pl-3 pointer-events-none z-50">
        <IconBrandLaravel className="text-laravel-red" size={20} stroke={1.5} />
      </div>
      <div className="flex-1 flex items-center pl-2 pointer-events-auto z-40">
        <MenuBar onNewFile={onNewFile} onOpenFile={onOpenFile} onOpenFolder={onOpenFolder} onSave={onSave} />
      </div>
      <div className="flex h-full items-center pr-2 gap-2">
        <button
          className="group flex items-center justify-center w-6 h-6 rounded-full hover:bg-gray-700 transition-colors focus:outline-none"
          onClick={minimize}
        >
          <IconMinus
            size={16}
            className="text-gray-400 group-hover:text-white"
          />
        </button>
        <button
          className="group flex items-center justify-center w-6 h-6 rounded-full hover:bg-gray-700 transition-colors focus:outline-none"
          onClick={toggleMaximize}
        >
          {isMaximized ? (
            <IconCopy size={16} className="text-gray-400 group-hover:text-white" />
          ) : (
            <IconSquare size={16} className="text-gray-400 group-hover:text-white" />
          )}
        </button>
        <button
          className="group flex items-center justify-center w-6 h-6 rounded-full hover:bg-red-600 transition-colors focus:outline-none"
          onClick={close}
        >
          <IconX
            size={16}
            className="text-gray-400 group-hover:text-white"
          />
        </button>
      </div>
    </header>
  );
}
