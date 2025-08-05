// Message role type, following Anthropic pattern
export type Role = "user" | "assistant" | "system";

// Content type (can be extended to support more complex structures)
export type Content = string;

// Message type
export interface Message {
  role: Role;
  content: Content;
}

// RequestParams for LLM generation
export interface RequestParams {
  model: string;
  temperature?: number;
  max_tokens?: number;
}

export interface LLMService {
  generate(messages: Message[], requestParams: RequestParams): Promise<Message>;
  generateStructured<T>(messages: Message[], requestParams: RequestParams): Promise<T>;
}

import { GoogleGenAI } from "@google/genai";

export class MockLLMService implements LLMService {
  async generate(messages: Message[], requestParams: RequestParams): Promise<Message> {
    // Return a mock assistant message
    return {
      role: "assistant",
      content: `Mock response to: ${messages.map(m => m.content).join(" ")}`
    };
  }

  async generateStructured<T>(messages: Message[], requestParams: RequestParams): Promise<T> {
    // Return an empty object as T (not type-safe, but fine for a mock)
    return {} as T;
  }
}

export class GeminiLLM implements LLMService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({}); // Uses GEMINI_API_KEY from env
  }

  private toGeminiContents(messages: Message[]): any[] {
    // Gemini expects an array of { role, parts: [{ text }] }
    return messages.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));
  }

  async generate(messages: Message[], requestParams: RequestParams): Promise<Message> {
    const { model, temperature, max_tokens } = requestParams;
    const contents = this.toGeminiContents(messages);
    const generationConfig: any = {};
    if (typeof temperature === "number") generationConfig.temperature = temperature;
    if (typeof max_tokens === "number") generationConfig.maxOutputTokens = max_tokens;
    const response = await this.ai.models.generateContent({
      model,
      contents,
      ...(Object.keys(generationConfig).length ? { generationConfig } : {}),
    });
    // Gemini returns candidates[0].content.parts[0].text
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return {
      role: "assistant",
      content: text,
    };
  }

  async generateStructured<T>(messages: Message[], requestParams: RequestParams): Promise<T> {
    // For structured output, we expect the user to prompt Gemini to return JSON, then parse it
    const msg = await this.generate(messages, requestParams);
    try {
      return JSON.parse(msg.content) as T;
    } catch (e) {
      throw new Error("Failed to parse structured output from Gemini: " + e);
    }
  }
}
