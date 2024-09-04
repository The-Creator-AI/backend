import { Injectable } from '@nestjs/common';
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private geminiProModel: string = 'gemini-1.5-pro-exp-0827'; // Default model
  private geminiFlashModel: string = 'gemini-1.5-flash-exp-0827';
  private readonly geminiApiKeys: string[] = (process.env.GEMINI_API_KEY || '')
    .split(',')
    .map((key) => key.trim());
  private apiKeyUsage: { [key: string]: number } = {};

  constructor() {
    // Initialize last usage time for all API keys to 0
    this.geminiApiKeys.forEach((key) => (this.apiKeyUsage[key] = 0));
  }

  private selectApiKeyAndModel(): { apiKey: string; model: string } {
    const now = Date.now();
    for (const apiKey of this.geminiApiKeys) {
      if (now - this.apiKeyUsage[apiKey] > 60000) {
        return { apiKey, model: this.geminiProModel }; // Return pro model if key is available
      }
    }
    return { apiKey: this.geminiApiKeys[0], model: this.geminiFlashModel }; // Fallback to flash model
  }

  async sendPrompt(
    prompt: string,
    on?: { chunk?: (chunk: string) => void },
  ): Promise<string> {
    if (this.geminiApiKeys.length === 0) {
      throw new Error('GEMINI_API_KEY not set in environment variables.');
    }

    let responseText = '';

    const { apiKey, model } = this.selectApiKeyAndModel(); // Select API key and model

    console.log(`Using model: ${model}, API Key: ${apiKey}`);
    this.apiKeyUsage[apiKey] = Date.now(); // Update last usage time

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const gemini = genAI.getGenerativeModel({
        model,
      });
      const response = await gemini.generateContentStream({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: 'text/plain',
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ],
      });

      let retry = true;
      while (retry) {
        try {
          for await (const chunk of response.stream) {
            on?.chunk && on.chunk(chunk.text());
            responseText += chunk.text();
          }
          retry = false;
        } catch (e: any) {
          retry = true;
          console.log(e);
        }
      }
      return responseText; // Success, return response
    } catch (e: any) {
      console.log(`Error:`, e);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      this.sendPrompt(prompt, on);
    }

    throw new Error(
      'Could not get a response from Gemini after multiple attempts.',
    );
  }

  async getTokenCount(prompt: string): Promise<number> {
    const { apiKey, model } = this.selectApiKeyAndModel(); // Select API key and model
    const genAI = new GoogleGenerativeAI(apiKey);
    const gemini = genAI.getGenerativeModel({
      model,
    });
    return (await gemini.countTokens(prompt)).totalTokens;
  }
}
