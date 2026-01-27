import { useState, useEffect } from "react";
import { aiService } from "../../services/ai/AIService";
import { AISettings, DEFAULT_SETTINGS } from "../../services/ai/types";
import { IconX, IconDeviceFloppy } from "@tabler/icons-react";

interface ChatSettingsProps {
  onClose: () => void;
}

export default function ChatSettings({ onClose }: ChatSettingsProps) {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(aiService.getSettings());
  }, []);

  const handleSave = () => {
    aiService.saveSettings(settings);
    onClose();
  };

  return (
    <div className="absolute inset-0 z-20 bg-[#0f1523] p-4 flex flex-col">
      <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-2">
        <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wide">AI Settings</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
          <IconX size={16} />
        </button>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Active Provider</label>
          <select
            value={settings.provider}
            onChange={(e) => setSettings({ ...settings, provider: e.target.value as any })}
            className="w-full bg-[#1F2937] border border-gray-700 rounded text-sm text-white px-3 py-2 focus:outline-none focus:border-[#FF2D20]"
          >
            <option value="openai">OpenAI</option>
            <option value="gemini">Google Gemini</option>
          </select>
        </div>

        <div className="border-t border-gray-800 my-4" />

        {settings.provider === "openai" && (
          <div className="space-y-3 animate-fade-in">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">OpenAI API Key</label>
              <input
                type="password"
                value={settings.openAIKey}
                onChange={(e) => setSettings({ ...settings, openAIKey: e.target.value })}
                placeholder="sk-..."
                className="w-full bg-[#1F2937] border border-gray-700 rounded text-sm text-white px-3 py-2 focus:outline-none focus:border-[#FF2D20]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Model</label>
              <input
                type="text"
                value={settings.openAIModel}
                onChange={(e) => setSettings({ ...settings, openAIModel: e.target.value })}
                className="w-full bg-[#1F2937] border border-gray-700 rounded text-sm text-white px-3 py-2 focus:outline-none focus:border-[#FF2D20]"
              />
              <p className="text-[10px] text-gray-500 mt-1">e.g., gpt-4o, gpt-3.5-turbo</p>
            </div>
          </div>
        )}

        {settings.provider === "gemini" && (
          <div className="space-y-3 animate-fade-in">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Gemini API Key</label>
              <input
                type="password"
                value={settings.geminiKey}
                onChange={(e) => setSettings({ ...settings, geminiKey: e.target.value })}
                placeholder="AIza..."
                className="w-full bg-[#1F2937] border border-gray-700 rounded text-sm text-white px-3 py-2 focus:outline-none focus:border-[#FF2D20]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Model</label>
              <input
                type="text"
                value={settings.geminiModel}
                onChange={(e) => setSettings({ ...settings, geminiModel: e.target.value })}
                className="w-full bg-[#1F2937] border border-gray-700 rounded text-sm text-white px-3 py-2 focus:outline-none focus:border-[#FF2D20]"
              />
              <p className="text-[10px] text-gray-500 mt-1">e.g., gemini-2.5-pro, gemini-2.5-flash</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-800">
        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 bg-[#FF2D20] hover:bg-[#D9251A] text-white py-2 rounded text-sm font-medium transition-colors"
        >
          <IconDeviceFloppy size={16} />
          Save Settings
        </button>
      </div>
    </div>
  );
}
