import { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

export default function useTitleBar() {
  const appWindow = getCurrentWindow();
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const updateMaximizedState = async () => {
      setIsMaximized(await appWindow.isMaximized());
    };

    updateMaximizedState();

    const handleResize = () => {
      updateMaximizedState();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [appWindow]);

  const toggleMaximize = async () => {
    await appWindow.toggleMaximize();
  };

  const close = async () => {
    await appWindow.close();
  };

  const minimize = async () => {
    await appWindow.minimize();
  };

  return {
    isMaximized,
    toggleMaximize,
    close,
    minimize,
  };
}
