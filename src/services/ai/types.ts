export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface AIProvider {
  id: string;
  name: string;
  sendMessage(
    messages: ChatMessage[],
    apiKey: string,
    model?: string,
    context?: string
  ): Promise<string>;
}

export interface AISettings {
  provider: "openai" | "gemini";
  openAIKey: string;
  geminiKey: string;
  openAIModel: string;
  geminiModel: string;
}

export const DEFAULT_SETTINGS: AISettings = {
  provider: "gemini",
  openAIKey: "",
  geminiKey: "",
  openAIModel: "gpt-4o",
  geminiModel: "gemini-2.5-flash",
};
