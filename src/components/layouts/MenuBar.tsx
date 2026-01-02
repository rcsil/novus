import { MenuBarProps } from "../../types/components/layouts/MenuBar";
import Dropdown, { DropdownItem } from "../ui/Dropdown";

export default function MenuBar({ onNewFile, onOpenFile, onSave }: MenuBarProps) {
  return (
    <div className="flex items-center text-sm">
      <Dropdown
        trigger={
          <button className="px-3 py-1 text-gray-300 hover:bg-gray-800 hover:text-white rounded-md transition-colors focus:outline-none">
            File
          </button>
        }
      >
        <DropdownItem onClick={onNewFile}>
          New File
        </DropdownItem>
        <DropdownItem onClick={onOpenFile}>
          Open File...
        </DropdownItem>
        <div className="border-t border-gray-700 my-1"></div>
        <DropdownItem onClick={onSave}>
          Save
        </DropdownItem>
      </Dropdown>
    </div>
  );
}
