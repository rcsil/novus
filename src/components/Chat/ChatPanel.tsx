import { useState, useRef, useEffect } from "react";
import { IconSend, IconRobot, IconUser, IconSettings, IconEraser } from "@tabler/icons-react";
import { aiService } from "../../services/ai/AIService";
import { ChatMessage } from "../../services/ai/types";
import ChatSettings from "./ChatSettings";

interface ChatPanelProps {
  activeFileContent?: string;
  activeFileName?: string;
}

export default function ChatPanel({ activeFileContent, activeFileName }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I am your Laravel AI assistant. How can I help you with your code today?",
      timestamp: Date.now(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Build context
      let context = "";
      if (activeFileName && activeFileContent) {
        const codeBlockDelimiter = "```";
        context = `The user is currently viewing the file: ${activeFileName}\n\nFile Content:\n${codeBlockDelimiter}\n${activeFileContent.substring(0, 10000)}\n${codeBlockDelimiter}\n(Truncated if too long)`;
      }

      const responseText = await aiService.sendMessage([...messages, userMessage], context);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Error: ${error.message}. Please check your API settings.`, 
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Chat cleared. How can I help you?",
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-full bg-[#0f1523] text-gray-300 relative overflow-hidden">
      {/* Header */}
      <div className="h-8 shrink-0 flex items-center justify-between px-4 text-xs font-bold text-gray-500 uppercase tracking-wider bg-[#0f1523]/50 border-b border-gray-800">
        <span>AI Assistant</span>
        <div className="flex items-center gap-1">
          <button onClick={clearChat} className="p-1 hover:text-white hover:bg-white/5 rounded transition-colors" title="Clear Chat">
            <IconEraser size={14} />
          </button>
          <button onClick={() => setShowSettings(true)} className="p-1 hover:text-white hover:bg-white/5 rounded transition-colors" title="Settings">
            <IconSettings size={14} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${ 
              message.role === "assistant" ? "flex-row" : "flex-row-reverse"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${ 
                message.role === "assistant" ? "bg-indigo-500/20 text-indigo-400" : "bg-gray-700 text-gray-300"
              }`}
            >
              {message.role === "assistant" ? <IconRobot size={18} /> : <IconUser size={18} />}
            </div>
            <div
              className={`max-w-[85%] rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap ${ 
                message.role === "assistant"
                  ? "bg-[#1F2937] border border-gray-700 select-text"
                  : "bg-indigo-600 text-white select-text"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-indigo-500/20 text-indigo-400">
                    <IconRobot size={18} />
                </div>
                <div className="bg-[#1F2937] border border-gray-700 rounded-lg p-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800 bg-[#0f1523]">
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask anything about Laravel..."
            className="w-full bg-[#1F2937] border border-gray-700 text-white text-sm rounded-md pl-4 pr-10 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-gray-500"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white disabled:opacity-50 disabled:hover:text-gray-400 transition-colors"
          >
            <IconSend size={16} />
          </button>
        </div>
        {activeFileName && (
          <div className="text-[10px] text-gray-500 mt-2 flex items-center gap-1 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500/50"></span>
            Context active: {activeFileName}
          </div>
        )}
      </form>

      {/* Settings Modal Overlay */}
      {showSettings && <ChatSettings onClose={() => setShowSettings(false)} />}
    </div>
  );
}
