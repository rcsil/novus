import { AIProvider, ChatMessage, AISettings, DEFAULT_SETTINGS } from "./types";
import { OpenAIProvider } from "./providers/OpenAIProvider";
import { GeminiProvider } from "./providers/GeminiProvider";

class AIService {
  private providers: Record<string, AIProvider> = {};
  private settings: AISettings = DEFAULT_SETTINGS;

  constructor() {
    this.registerProvider(new OpenAIProvider());
    this.registerProvider(new GeminiProvider());
    this.loadSettings();
  }

  registerProvider(provider: AIProvider) {
    this.providers[provider.id] = provider;
  }

  loadSettings() {
    const saved = localStorage.getItem("ai_settings");
    if (saved) {
      this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  }

  saveSettings(settings: AISettings) {
    this.settings = settings;
    localStorage.setItem("ai_settings", JSON.stringify(settings));
  }

  getSettings() {
    return this.settings;
  }

  async sendMessage(messages: ChatMessage[], context?: string): Promise<string> {
    const providerId = this.settings.provider;
    const provider = this.providers[providerId];

    if (!provider) {
      throw new Error(`Provider ${providerId} not found.`);
    }

    let apiKey = "";
    let model = "";

    if (providerId === "openai") {
      apiKey = this.settings.openAIKey;
      model = this.settings.openAIModel;
    } else if (providerId === "gemini") {
      apiKey = this.settings.geminiKey;
      model = this.settings.geminiModel;
    }

    return provider.sendMessage(messages, apiKey, model, context);
  }
}

export const aiService = new AIService();
