import { AIProvider, ChatMessage } from "../types";

export class OpenAIProvider implements AIProvider {
  id = "openai";
  name = "OpenAI";

  async sendMessage(
    messages: ChatMessage[],
    apiKey: string,
    model: string = "gpt-4o",
    context?: string
  ): Promise<string> {
    if (!apiKey) {
      throw new Error("OpenAI API Key is missing.");
    }

    const systemMessage = {
      role: "system",
      content: `You are an expert Laravel and PHP developer assistant. 
      Your goal is to help the developer with high-quality, secure, and idiomatic code.
      Follow modern Laravel best practices (latest version).
      ${context ? `\nContext:\n${context}` : ""}`
    };

    const apiMessages = [
      systemMessage,
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: apiMessages,
      }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error?.message || `OpenAI API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
}
