import { IconBrandLaravel, IconMinus, IconSquare, IconCopy, IconX } from "@tabler/icons-react";
import useTitleBar from "../../hooks/components/layouts/useTitleBar";

export default function TitleBar() {
	const { minimize, toggleMaximize, close, isMaximized } = useTitleBar();

	return (
		<header
			data-tauri-drag-region
			className="h-9 flex items-center justify-between border-b border-gray-700/50 select-none"
		>
			<div className="flex items-center pl-3 gap-2 pointer-events-none">
        <IconBrandLaravel className="text-laravel-red" size={20} stroke={1.5} />
      </div>
			<div className="flex h-full items-center pr-2 gap-2">
				<button
          className="group flex items-center justify-center w-6 h-6 rounded-full hover:bg-gray-700 transition-colors focus:outline-none"
          onClick={minimize}
          title="Minimize"
        >
          <IconMinus 
            size={16} 
            className="text-gray-400 group-hover:text-white" 
          />
        </button>
        <button
          className="group flex items-center justify-center w-6 h-6 rounded-full hover:bg-gray-700 transition-colors focus:outline-none"
          onClick={toggleMaximize}
          title={isMaximized ? "Restore" : "Maximize"}
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
          title="Close"
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
