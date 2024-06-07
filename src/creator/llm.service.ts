import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory, Part } from '@google/generative-ai';
import * as openai from 'openai';

@Injectable()
export class LlmService {
    private readonly geminiApiKey: string | undefined = process.env.GEMINI_API_KEY;
    private readonly openaiApiKey: string | undefined = process.env.OPENAI_API_KEY;

    getModelName(): string {
        if (this.geminiApiKey) {
          return 'Gemini Pro';
        } else if (this.openaiApiKey) {
          return 'GPT-3.5 Turbo';
        } else {
          throw new Error('No API key found. Please set either GEMINI_API_KEY or OPENAI_API_KEY environment variable.');
        }
      }

    async sendPrompt(prompt: string): Promise<string> {
        const { type, apiKey } = this.getApiKey();

        if (type === 'gemini') {
            return this.sendPromptToGemini(prompt);
        } else if (type === 'openai') {
            return this.sendPromptToOpenAI(prompt);
        } else {
            throw new Error('No API key found. Please set either GEMINI_API_KEY or OPENAI_API_KEY environment variable.');
        }
    }

    private async sendPromptToGemini(prompt: string): Promise<string> {
        if (!this.geminiApiKey) {
            throw new Error('GEMINI_API_KEY not set in environment variables.');
        }

        const genAI = new GoogleGenerativeAI(this.geminiApiKey);
        const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-pro-latest' });

        const response = await model.generateContent({
            contents: [{
                role: 'user',
                parts: [{ text: prompt }],
            }],
            generationConfig: {
                responseMimeType: 'text/plain',
            },
            // safetySettings: [{
            //     category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            //     threshold: HarmBlockThreshold.BLOCK_NONE,
            // }, {
            //     category: HarmCategory.HARM_CATEGORY_UNSPECIFIED,
            //     threshold: HarmBlockThreshold.BLOCK_NONE
            // }]
        });

        return response.response.text();
    }

    private async sendPromptToOpenAI(prompt: string): Promise<string> {
        if (!this.openaiApiKey) {
            throw new Error('OPENAI_API_KEY not set in environment variables.');
        }

        const model = new openai.OpenAI({
            apiKey: this.openaiApiKey,
        });

        const response = await model.completions.create({
            model: "gpt-3.5-turbo",
            prompt: prompt,
        });

        return response.choices[0].text || '';
    }

    private getApiKey() {
        if (this.geminiApiKey && this.openaiApiKey) {
            console.warn("Both GEMINI_API_KEY and OPENAI_API_KEY are set. Using GEMINI_API_KEY.");
        }

        if (this.geminiApiKey) {
            return { type: 'gemini', apiKey: this.geminiApiKey };
        } else if (this.openaiApiKey) {
            return { type: 'openai', apiKey: this.openaiApiKey };
        } else {
            throw new Error('Please set either GEMINI_API_KEY or OPENAI_API_KEY environment variable.');
        }
    }
}