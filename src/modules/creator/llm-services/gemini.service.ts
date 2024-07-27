import { Injectable } from '@nestjs/common';
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private geminiProModel: string = 'models/gemini-1.5-pro-latest'; // Default model
  private geminiFlashModel: string = 'gemini-1.5-flash-latest';
  private currentModel: string = this.geminiProModel; // Track the current model being used
  private readonly geminiApiKey: string | undefined =
    process.env.GEMINI_API_KEY;

  async sendPrompt(
    prompt: string,
    on?: { chunk?: (chunk: string) => void },
  ): Promise<string> {
    if (!this.geminiApiKey) {
      throw new Error('GEMINI_API_KEY not set in environment variables.');
    }

    const genAI = new GoogleGenerativeAI(this.geminiApiKey);
    let debounce = 0;
    let attempts = 0;
    let responseText = '';

    while (attempts < 3) {
      attempts++;
      if (debounce > 0) {
        console.log(`Waiting for ${Math.floor(debounce / 1000)} seconds...`);
      }
      console.log(`Using model: ${this.currentModel}`);
      await new Promise((resolve) => setTimeout(resolve, debounce));
      try {
        const gemini = genAI.getGenerativeModel({
          model: this.currentModel,
        }); // Use currentModel here
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
        debounce = 0;
        return responseText;
      } catch (e: any) {
        debounce += 5000;
        if (e.status === 429 && this.currentModel === this.geminiProModel) {
          this.currentModel = this.geminiFlashModel; // Update currentModel
          console.log(
            `${this.geminiProModel} limit reached, trying with ${this.geminiFlashModel}`,
          );
          continue;
        }
        console.log(e);
      }
    }
    throw new Error(
      'Could not get a response from Gemini after multiple attempts.',
    );
  }

  async getTokenCount(prompt: string): Promise<number> {
    const genAI = new GoogleGenerativeAI(this.geminiApiKey);
    const gemini = genAI.getGenerativeModel({
      model: this.currentModel,
    });
    return (await gemini.countTokens(prompt)).totalTokens;
  }
}
