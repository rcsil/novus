import { useEffect, useRef, useState } from "react";
import { getName, getVersion, getTauriVersion } from "@tauri-apps/api/app";
import { IconBrandLaravel, IconX } from "@tabler/icons-react";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface VersionInfo {
  label: string;
  value: string;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [info, setInfo] = useState<VersionInfo[]>([]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      loadInfo();
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const loadInfo = async () => {
    try {
      const [appName, appVersion, tauriVersion] = await Promise.all([
        getName(),
        getVersion(),
        getTauriVersion(),
      ]);

      const userAgent = navigator.userAgent;
      // Extract Chrome/Webview version roughly
      const chromeMatch = userAgent.match(/Chrome\/(\S+)/);
      const chromeVersion = chromeMatch ? chromeMatch[1] : "Unknown";

      const data: VersionInfo[] = [
        { label: "Product Name", value: appName },
        { label: "Version", value: appVersion },
        { label: "Tauri", value: tauriVersion },
        { label: "WebView/Chromium", value: chromeVersion },
        { label: "OS", value: navigator.platform }, // Basic OS info
        { label: "User Agent", value: userAgent },
      ];
      setInfo(data);
    } catch (error) {
      console.error("Failed to load app info:", error);
      setInfo([
        { label: "Error", value: "Could not load application information" }
      ]);
    }
  };

  if (!isOpen) return null;

  const handleCopy = () => {
    const text = info.map(i => `${i.label}: ${i.value}`).join("\n");
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="bg-[#1F2937] border border-gray-700 rounded-lg shadow-2xl w-[500px] max-w-full text-gray-300"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <IconBrandLaravel className="text-[#FF2D20]" size={24} />
            <span className="font-semibold text-white">About Novus</span>
          </div>
          <button onClick={onClose} className="hover:text-white transition-colors cursor-pointer">
            <IconX size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1 text-sm font-mono select-text overflow-x-auto">
            {info.length === 0 ? (
              <p>Loading...</p>
            ) : (
              info.map((item) => (
                <div key={item.label} className="flex">
                  <span className="w-40 shrink-0 text-gray-500">{item.label}:</span>
                  <span className="text-gray-300">{item.value}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="p-4 border-t border-gray-700 flex justify-end gap-2">
          <button
            onClick={handleCopy}
            className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors cursor-pointer"
          >
            Copy
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-[#FF2D20] hover:bg-[#D9251A] text-white rounded transition-colors cursor-pointer"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
