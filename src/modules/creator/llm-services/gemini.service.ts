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
  private apiKeyUsage: { [key: string]: { lastUsed: number; count: number } } =
    {};

  constructor() {
    // Initialize last usage time and count for all API keys
    this.geminiApiKeys.forEach(
      (key) => (this.apiKeyUsage[key] = { lastUsed: 0, count: 0 }),
    );
  }

  private selectApiKeyAndModel(giveFallback: boolean = false): {
    apiKey: string;
    model: string;
  } {
    if (giveFallback) {
      const apiKey = this.geminiApiKeys[0];
      return { apiKey, model: this.geminiFlashModel };
    } else {
      const now = Date.now();
      for (const apiKey of this.geminiApiKeys) {
        if (now - this.apiKeyUsage[apiKey].lastUsed > 60000) {
          // Reset count if more than 60 seconds have passed
          this.apiKeyUsage[apiKey].count = 0;
        }
        if (this.apiKeyUsage[apiKey].count < 2) {
          // Use the key if it has been used less than twice in the last 60 seconds
          this.apiKeyUsage[apiKey].count++;
          this.apiKeyUsage[apiKey].lastUsed = now;
          return { apiKey, model: this.geminiProModel }; // Return pro model
        }
      }
      // If all keys have been used twice in the last 60 seconds, fallback to flash model
      console.log('All API keys have been used twice in the last 60 seconds.');
      // list down the keys and their usage, last used should be the number of seconds ago
      console.log(
        Object.entries(this.apiKeyUsage).map(([key, value]) => ({
          key,
          ...value,
          lastUsed: (now - value.lastUsed) / 1000,
        })),
      );
      const fallbackKey = this.geminiApiKeys[0];
      return { apiKey: fallbackKey, model: this.geminiFlashModel };
    }
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
    this.apiKeyUsage[apiKey] = {
      ...this.apiKeyUsage[apiKey],
      count: this.apiKeyUsage[apiKey].count + 1,
      lastUsed: Date.now(),
    };

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
    const { apiKey, model } = this.selectApiKeyAndModel(true); // Select API key and model
    const genAI = new GoogleGenerativeAI(apiKey);
    const gemini = genAI.getGenerativeModel({
      model,
    });
    return (await gemini.countTokens(prompt)).totalTokens;
  }
}
