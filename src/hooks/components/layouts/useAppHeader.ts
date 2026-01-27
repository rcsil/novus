import { useState } from "react";

type Menu = "fileDropdown" | "helpDropdown" | null;

export function useAppHeader() {
  const [openMenu, setOpenMenu] = useState<Menu>(null);

	return {
		openMenu,
		setOpenMenu
	};
}