import { IconFiles, IconGitMerge, IconBrandLaravel, IconMessageChatbot } from "@tabler/icons-react";

type ActivityBarView = "explorer" | "source-control" | "laravel" | "chat";

interface ActivityBarProps {
  activeView: ActivityBarView;
  onViewChange: (view: ActivityBarView) => void;
}

export default function ActivityBar({ activeView, onViewChange }: ActivityBarProps) {
  return (
    <div className="w-14 bg-background/90 border-gray-800 flex flex-col items-center py-2 gap-2">
      <ActivityBarIcon
        icon={<IconFiles size={18} stroke={1.5} />}
        isActive={activeView === "explorer"}
        onClick={() => onViewChange("explorer")}
      />
      <ActivityBarIcon
        icon={<IconGitMerge size={18} stroke={1.5} />}
        isActive={activeView === "source-control"}
        onClick={() => onViewChange("source-control")}
      />
      <ActivityBarIcon
        icon={<IconMessageChatbot size={18} stroke={1.5} />}
        isActive={activeView === "chat"}
        onClick={() => onViewChange("chat")}
      />
      <div className="w-8 h-px bg-gray-700/50 my-1" />
      <ActivityBarIcon
        icon={<IconBrandLaravel size={18} stroke={1.5} className="text-[#FF2D20]" />}
        isActive={activeView === "laravel"}
        onClick={() => onViewChange("laravel")}
      />
    </div>
  );
}

interface ActivityBarIconProps {
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

function ActivityBarIcon({ icon, isActive, onClick }: ActivityBarIconProps) {
  return (
    <button
      onClick={onClick}
      className={`w-10 h-10 flex items-center justify-center rounded-lg relative transition-colors
        ${isActive ? "bg-gray-700 text-white" : "text-gray-500 hover:bg-gray-800 hover:text-white"}
      `}
    >
      {icon}
      {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#FF2D20] rounded-r-full" />}
    </button>
  );
}