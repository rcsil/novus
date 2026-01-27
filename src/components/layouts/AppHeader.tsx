import { useState, useRef, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  IconMinus,
  IconSquare,
  IconX,
  IconCopy,
  IconBrandLaravel
} from "@tabler/icons-react";
import AboutModal from "../AboutModal";
import { useAppHeader } from "../../hooks/components/layouts/useAppHeader";
import Dropdown, { ButtonDropdown, DropdownItem } from "../ui/Dropdown";

interface AppHeaderProps {
  onOpen: () => void;
  onOpenFolder: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onClose: () => void;
  fileName?: string;
  isDirty?: boolean;
}

export default function AppHeader({
  onOpen,
  onOpenFolder,
  onSave,
  onSaveAs,
  onClose,
  fileName,
  isDirty,
}: AppHeaderProps) {
  const appWindow = getCurrentWindow();
  const { openMenu, setOpenMenu } = useAppHeader();

  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const helpMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    appWindow.isMaximized().then(setIsMaximized);

    const unlisten = appWindow.listen("tauri://resize", async () => {
      setIsMaximized(await appWindow.isMaximized());
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, [appWindow]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        openMenu &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        helpMenuRef.current &&
        !helpMenuRef.current.contains(event.target as Node)
      ) {
        setOpenMenu(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenu, setOpenMenu]);

  const handleMenuClick = (action: () => void) => {
    setOpenMenu(null);
    action();
  };

  const handleMinimize = () => appWindow.minimize();

  const handleMaximize = async () => {
    await appWindow.toggleMaximize();
    setIsMaximized(await appWindow.isMaximized());
  };

  const handleCloseWindow = () => appWindow.close();

  return (
    <>
      <header
        data-tauri-drag-region
        className="flex items-center justify-between select-none shrink-0 p-1.5 px-3"
      >
        <div className="flex items-center z-10">
          <div className="flex items-center text-[#FF2D20] pr-3">
            <IconBrandLaravel size={20} stroke={1} />
          </div>
          <div className="flex items-center gap-1">
            {/* File Menu */}
            <div className="relative" ref={menuRef}>
              <ButtonDropdown
                onClick={() => setOpenMenu((prev) => (prev === "fileDropdown" ? null : "fileDropdown"))}
                isOpen={openMenu === "fileDropdown"}
              >
                File
              </ButtonDropdown>
              {openMenu === "fileDropdown" && (
                <Dropdown>
                  <DropdownItem label="Open File" shortcut="Ctrl + O" onClick={() => handleMenuClick(onOpen)} />
                  <DropdownItem label="Open Folder" shortcut="Ctrl + Shift + O" onClick={() => handleMenuClick(onOpenFolder)} />
                  <div className="h-px bg-gray-700 my-1 w-full" />
                  <DropdownItem label="Save" shortcut="Ctrl+S" onClick={() => handleMenuClick(onSave)} />
                  <DropdownItem label="Save As" shortcut="Ctrl + Shift + S" onClick={() => handleMenuClick(onSaveAs)} />
                  <div className="h-px bg-gray-700 my-1 w-full" />
                  <DropdownItem label="Close" shortcut="Alt + F4" onClick={() => handleMenuClick(onClose)} danger />
                </Dropdown>
              )}
            </div>

            {/* Help Menu */}
            <div className="relative" ref={helpMenuRef}>
              <ButtonDropdown
                onClick={() => setOpenMenu((prev) => (prev === "helpDropdown" ? null : "helpDropdown"))}
                isOpen={openMenu === "helpDropdown"}
              >
                Help
              </ButtonDropdown>
              {openMenu === "helpDropdown" && (
                <Dropdown>
                  <DropdownItem label="About" onClick={() => handleMenuClick(() => setIsAboutOpen(true))} />
                </Dropdown>
              )}
            </div>
          </div>
        </div>

        {/* Title & Dirty Indicator */}
        <div
          className="absolute left-1/2 transform -translate-x-1/2 text-sm text-gray-400 flex items-center gap-2 pointer-events-none"
          data-tauri-drag-region
        >
          <span className="font-medium text-gray-300 truncate max-w-75">
            {fileName}
          </span>
          {isDirty && <span className="w-2 h-2 rounded-full bg-[#FF2D20]" />}
        </div>

        {/* Window Controls */}
        <div className="flex items-center h-full z-10">
          <button
            onClick={handleMinimize}
            className="flex h-6 w-6 items-center justify-center text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-colors focus:outline-none"
            aria-label="Minimize"
          >
            <IconMinus size={12} stroke={1.5} />
          </button>
          <button
            onClick={handleMaximize}
            className="flex h-6 w-6 items-center justify-center text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-colors focus:outline-none"
            aria-label="Maximize"
          >
            {isMaximized ? (
              <IconCopy size={12} stroke={1.5} style={{ transform: "rotate(180deg)" }} />
            ) : (
              <IconSquare size={12} stroke={1.5} />
            )}
          </button>
          <button
            onClick={handleCloseWindow}
            className="flex h-6 w-6 items-center justify-center text-gray-400 rounded-full hover:bg-[#FF2D20] hover:text-white transition-transform hover:rotate-90 focus:outline-none"
            aria-label="Close"
          >
            <IconX size={12} stroke={1.5} />
          </button>
        </div>
      </header>

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </>
  );
}
