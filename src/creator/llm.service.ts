import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory, Part } from '@google/generative-ai';
import * as openai from 'openai';
import { CreatorService } from './creator.service';

@Injectable()
export class LlmService {
    private readonly geminiApiKey: string | undefined = process.env.GEMINI_API_KEY;
    private readonly openaiApiKey: string | undefined = process.env.OPENAI_API_KEY;

    private geminiProModel: string = 'models/gemini-1.5-pro-latest'; // Default model
    private geminiFlashModel: string = 'gemini-1.5-flash-latest';
    private openaiModel: string = 'gpt-3.5-turbo';

    private currentModel: string = this.geminiProModel; // Track the current model being used

    constructor(private readonly creatorService: CreatorService) { }

    async sendPrompt(chatHistory: {
        user: string;
        message: string;
      }[], selectedFiles: string[] = []): Promise<string> {
        const { type, apiKey } = this.getApiKey();

        // Read selected files content before sending the prompt
        const fileContents = this.creatorService.readSelectedFilesContent(selectedFiles);

        // Append file contents to prompt
        let prompt = '';
        for (const filePath in fileContents) {
            prompt += `\n\n\`\`\`
    File: ${filePath}
    ${fileContents[filePath]}
    \`\`\`\n\n`;
        }
        chatHistory.forEach(message => {
            prompt += `${message.user}: ${message.message}\n`;
        });

        console.log(`Prompt:\n\n\n`);
        console.log(prompt);

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
        let debounce = 0;
        let attempts = 0;

        while (attempts < 3) {
            attempts++;
            if (debounce > 0) {
                console.log(`Waiting for ${Math.floor(debounce / 1000)} seconds...`);
            }
            await new Promise(resolve => setTimeout(resolve, debounce));
            try {
                const gemini = genAI.getGenerativeModel({ model: this.currentModel }); // Use currentModel here
                const response = await gemini.generateContent({
                    contents: [{
                        role: 'user',
                        parts: [{ text: prompt }],
                    }],
                    generationConfig: {
                        responseMimeType: 'text/plain',
                    },
                });
                debounce = 0;
                return response.response.text();
            } catch (e: any) {
                debounce += 5000;
                if (e.status === 429 && this.currentModel === this.geminiProModel) {
                    this.currentModel = this.geminiFlashModel; // Update currentModel
                    console.log(`${this.geminiProModel} limit reached, trying with ${this.geminiFlashModel}`);
                    continue;
                }
                console.log(e);
                // Handle other errors, e.g., throw an error, return a default message, etc.
            }
        }
        throw new Error('Could not get a response from Gemini after multiple attempts.');
    }

    getModelName(): string {
        return this.currentModel; // Access currentModel here
    }

    private async sendPromptToOpenAI(prompt: string): Promise<string> {
        if (!this.openaiApiKey) {
            throw new Error('OPENAI_API_KEY not set in environment variables.');
        }

        const model = new openai.OpenAI({
            apiKey: this.openaiApiKey,
        });

        this.currentModel = this.openaiModel;
        const response = await model.completions.create({
            model: this.openaiModel,
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