import { AIProvider, ChatMessage } from "../types";

export class GeminiProvider implements AIProvider {
  id = "gemini";
  name = "Google Gemini";

  async sendMessage(
    messages: ChatMessage[],
    apiKey: string,
    model: string = "gemini-2.5-flash",
    context?: string
  ): Promise<string> {
    if (!apiKey) {
      throw new Error("Gemini API Key is missing.");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const systemPrompt = `You are an expert Laravel and PHP developer assistant. 
    Your goal is to help the developer with high-quality, secure, and idiomatic code.
    Follow modern Laravel best practices (latest version).
    ${context ? `\nContext:\n${context}` : ""}`;

    // Gemini API format is slightly different
    const contents = [
        {
            role: "user",
            parts: [{ text: systemPrompt }] 
        },
        {
            role: "model",
            parts: [{ text: "Understood. I am ready to assist you with Laravel and PHP development tasks." }]
        },
        ...messages.map(m => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }]
        }))
    ];

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
      }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error?.message || `Gemini API Error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates.length > 0) {
        return data.candidates[0].content.parts[0].text;
    }
    
    return "";
  }
}
