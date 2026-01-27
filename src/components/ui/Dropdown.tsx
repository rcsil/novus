import React from "react";

export default function Dropdown({ children }: { children: React.ReactNode }) {
	return (
		<div className="absolute top-full left-0 mt-1 w-56 bg-[#1F2937] border border-gray-700 rounded-md shadow-xl z-50 py-1 flex flex-col">
			{children}
		</div>
	);
}

interface AppMenuItemProps {
	label?: string;
	shortcut?: string;
	onClick: () => void;
	danger?: boolean;
}

export function DropdownItem({
	label,
	shortcut,
	onClick,
	danger,
}: AppMenuItemProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`text-left px-4 py-2 text-xs flex justify-between items-center transition-colors group mx-1 rounded-md
        ${danger
					? "text-red-500/70 hover:bg-red-500/10 group-hover:text-red-400"
					: "text-gray-200 hover:bg-gray-700"
				}
      `}
		>
			<span>{label}</span>

			{shortcut && (
				<span
					className={`text-[10px] ${danger
							? "text-red-500/70 group-hover:text-red-400"
							: "text-gray-500 group-hover:text-gray-400"
						}`}
				>
					{shortcut}
				</span>
			)}
		</button>
	);
}

interface ButtonDropdownProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	children: React.ReactNode;
	isOpen: boolean;
}

export function ButtonDropdown({
	children,
	isOpen,
	className,
	...props
}: ButtonDropdownProps) {
	return (
		<button
			type="button"
			className={`text-xs px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors focus:outline-none
        ${isOpen
					? "bg-gray-900 text-white"
					: "text-gray-400 hover:bg-gray-900 hover:text-white"
				}
        ${className ?? ""}
      `}
			{...props}
		>
			{children}
		</button>
	);
}