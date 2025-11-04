import {
  GoogleGenerativeAI,
  GenerativeModel,
  GenerateContentResult,
} from "@google/generative-ai";

// Initialize Gemini client
const genai = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

// Available Gemini models with their output token limits
export const GEMINI_MODELS = {
  PRO: {
    name: "gemini-2.5-pro",
    maxOutputTokens: 32768,
    description:
      "Premium model for all funnels - high quality content generation",
  },
} as const;

export type GeminiModelType = typeof GEMINI_MODELS.PRO;

/**
 * Select the appropriate Gemini model based on funnel complexity and size
 *
 * ALWAYS USE PRO: We use gemini-2.5-pro exclusively for all generations
 * to ensure consistent high-quality output.
 */
export function selectGeminiModel(
  estimatedOutputTokens: number,
  options?: {
    totalElements?: number;
    promptLength?: number;
  }
): GeminiModelType {
  // ALWAYS return Pro - we only use one model now
  return GEMINI_MODELS.PRO;
}

/**
 * Get a Gemini model instance
 */
export function getGeminiModel(modelName: string): GenerativeModel {
  return genai.getGenerativeModel({ model: modelName });
}

/**
 * Generate content using Gemini (non-streaming)
 */
export async function generateContent(
  modelName: string,
  prompt: string,
  systemInstruction?: string
): Promise<{
  text: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}> {
  const model = genai.getGenerativeModel({
    model: modelName,
    systemInstruction: systemInstruction,
  });

  const result = await model.generateContent(prompt);
  const response = result.response;

  return {
    text: response.text(),
    inputTokens: response.usageMetadata?.promptTokenCount || 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
    totalTokens: response.usageMetadata?.totalTokenCount || 0,
  };
}

/**
 * Generate content using Gemini with streaming
 */
export async function generateContentStream(
  modelName: string,
  prompt: string,
  systemInstruction?: string
): Promise<{
  text: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}> {
  const model = genai.getGenerativeModel({
    model: modelName,
    systemInstruction: systemInstruction,
  });

  const result = await model.generateContentStream(prompt);

  let fullText = "";
  let inputTokens = 0;
  let outputTokens = 0;
  let totalTokens = 0;

  // Stream the response
  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    fullText += chunkText;

    // Update token counts from chunk metadata if available
    if (chunk.usageMetadata) {
      inputTokens = chunk.usageMetadata.promptTokenCount || 0;
      outputTokens = chunk.usageMetadata.candidatesTokenCount || 0;
      totalTokens = chunk.usageMetadata.totalTokenCount || 0;
    }
  }

  // Get final metadata after stream completes
  const finalResponse = await result.response;
  if (finalResponse.usageMetadata) {
    inputTokens = finalResponse.usageMetadata.promptTokenCount || 0;
    outputTokens = finalResponse.usageMetadata.candidatesTokenCount || 0;
    totalTokens = finalResponse.usageMetadata.totalTokenCount || 0;
  }

  return {
    text: fullText,
    inputTokens,
    outputTokens,
    totalTokens,
  };
}

export function parseJSONFromResponse(responseText: string): string {
  // Remove markdown code blocks if present
  let cleanedText = responseText.trim();

  // Remove ```json or ``` wrapper
  if (cleanedText.startsWith("```json")) {
    cleanedText = cleanedText.slice(7); // Remove ```json
  } else if (cleanedText.startsWith("```")) {
    cleanedText = cleanedText.slice(3); // Remove ```
  }

  if (cleanedText.endsWith("```")) {
    cleanedText = cleanedText.slice(0, -3); // Remove trailing ```
  }

  cleanedText = cleanedText.trim();

  // Extract JSON using regex as fallback
  const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  return cleanedText;
}

/**
 * Check if Gemini API is configured
 */
export function isGeminiConfigured(): boolean {
  return !!process.env.GOOGLE_API_KEY;
}

/**
 * Validate Gemini API key works
 */
export async function validateGeminiKey(): Promise<boolean> {
  if (!isGeminiConfigured()) {
    return false;
  }

  try {
    // Test with simple API call using Pro model
    const model = genai.getGenerativeModel({ model: GEMINI_MODELS.PRO.name });
    await model.generateContent("Hi");
    return true;
  } catch {
    return false;
  }
}

/**
 * Get token usage from response
 */
export function getTokenUsage(result: GenerateContentResult): {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
} {
  const usage = result.response.usageMetadata;
  return {
    inputTokens: usage?.promptTokenCount || 0,
    outputTokens: usage?.candidatesTokenCount || 0,
    totalTokens: usage?.totalTokenCount || 0,
  };
}
