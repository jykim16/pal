import { GeminiLLM } from "./llm";
import type { Message, RequestParams } from "./llm";

describe("GeminiLLM", () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    it.skip("GEMINI_API_KEY not set, skipping GeminiLLM tests", () => {});
    return;
  }

  it("should return a response for a simple prompt", async () => {
    const llm = new GeminiLLM();
    const messages: Message[] = [
      { role: "user", content: "What is the capital of France?" }
    ];
    const params: RequestParams = {
      model: "gemini-2.0-flash",
      temperature: 0.2,
      max_tokens: 32
    };
    const response = await llm.generate(messages, params);
    expect(response).toHaveProperty("role", "assistant");
    expect(typeof response.content).toBe("string");
    expect(response.content.length).toBeGreaterThan(0);
  }, 20000); // 20s timeout for LLM call
});