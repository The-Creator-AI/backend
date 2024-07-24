import { Injectable } from '@nestjs/common';
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from '@google/generative-ai';
import * as openai from 'openai';
import { CreatorService } from './creator.service';
import { encoding_for_model } from 'tiktoken';

@Injectable()
export class LlmService {
  private readonly geminiApiKey: string | undefined =
    process.env.GEMINI_API_KEY;
  private readonly openaiApiKey: string | undefined =
    process.env.OPENAI_API_KEY;

  private geminiProModel: string = 'models/gemini-1.5-pro-latest'; // Default model
  private geminiFlashModel: string = 'gemini-1.5-flash-latest';
  private openaiModel: string = 'gpt-4o-mini';

  private currentModel: string = this.geminiProModel; // Track the current model being used

  constructor(private readonly creatorService: CreatorService) {}

  private async buildPrompt(
    chatHistory: { user: string; message: string }[],
    selectedFiles: string[] = [],
  ): Promise<string> {
    // Read selected files content before sending the prompt
    const fileContents =
      this.creatorService.readSelectedFilesContent(selectedFiles);

    // Append file contents to prompt
    let prompt = '';
    for (const filePath in fileContents) {
      prompt += `\n\n\`\`\`
    File: ${filePath}
    ${fileContents[filePath]}
    \`\`\`\n\n`;
    }
    chatHistory.forEach((message) => {
      prompt += `${message.user}: ${message.message}\n`;
    });

    // console.log(`Prompt:\n\n\n`);
    // console.log(prompt);
    return prompt;
  }

  async sendPrompt(
    chatHistory: { user: string; message: string }[],
    selectedFiles: string[] = [],
    on?: {
      chunk?: (chunk: string) => void;
    },
  ): Promise<string> {
    const prompt = await this.buildPrompt(chatHistory, selectedFiles);
    console.log(`Prompt:\n\n\n`);
    console.log(prompt);
    const { type } = this.getApiKey();
    if (type === 'gemini') {
      return this.sendPromptToGemini(prompt, {
        chunk: on?.chunk,
      });
    } else if (type === 'openai') {
      return this.sendPromptToOpenAI(prompt, {
        chunk: on?.chunk,
      });
    } else {
      throw new Error(
        'No API key found. Please set either GEMINI_API_KEY or OPENAI_API_KEY environment variable.',
      );
    }
  }

  async getTokenCount(
    chatHistory: { user: string; message: string }[],
    selectedFiles: string[] = [],
  ): Promise<number> {
    const prompt = await this.buildPrompt(chatHistory, selectedFiles);
    const { type } = this.getApiKey();
    if (type === 'gemini') {
      return this.getTokenCountToGemini(prompt);
    } else if (type === 'openai') {
      return this.getTokenCountToOpenAI(prompt);
    } else {
      throw new Error(
        'No API key found. Please set either GEMINI_API_KEY or OPENAI_API_KEY environment variable.',
      );
    }
  }

  async summarize(
    text: string,
    on?: { chunk?: (chunk: string) => void },
  ): Promise<string> {
    const prompt = `Summarize this text: \n\n\n${text}`;
    const { type } = this.getApiKey();
    if (type === 'gemini') {
      return this.sendPromptToGemini(prompt, {
        chunk: on?.chunk,
      });
    } else if (type === 'openai') {
      return this.sendPromptToOpenAI(prompt);
    } else {
      throw new Error(
        'No API key found. Please set either GEMINI_API_KEY or OPENAI_API_KEY environment variable.',
      );
    }
  }

  private async sendPromptToGemini(
    prompt: string,
    on?: {
      chunk?: (chunk: string) => void;
    },
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
              console.log(chunk.text());
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
        // Handle other errors, e.g., throw an error, return a default message, etc.
      }
    }
    throw new Error(
      'Could not get a response from Gemini after multiple attempts.',
    );
  }

  getModelName(): string {
    return this.currentModel; // Access currentModel here
  }

  private async sendPromptToOpenAI(
    prompt: string,
    on?: {
      chunk?: (chunk: string) => void;
    },
  ): Promise<string> {
    if (!this.openaiApiKey) {
      throw new Error('OPENAI_API_KEY not set in environment variables.');
    }

    const model = new openai.OpenAI({
      apiKey: this.openaiApiKey,
    });

    this.currentModel = this.openaiModel;
    const response = await model.chat.completions.create({
      model: this.openaiModel,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });

    // return response.choices[0].message?.content || '';

    let responseText = '';
    for await (const chunk of response) {
      on?.chunk && on.chunk(chunk.choices[0].delta?.content || '');
      responseText += chunk.choices[0].delta?.content || '';
      console.log(chunk.choices[0].delta?.content || '');
    }
    return responseText;
  }

  private getApiKey() {
    if (this.geminiApiKey && this.openaiApiKey) {
      console.warn(
        'Both GEMINI_API_KEY and OPENAI_API_KEY are set. Using GEMINI_API_KEY.',
      );
    }

    if (this.geminiApiKey) {
      this.currentModel = this.geminiProModel;
      return { type: 'gemini', apiKey: this.geminiApiKey };
    } else if (this.openaiApiKey) {
      this.currentModel = this.openaiModel;
      return { type: 'openai', apiKey: this.openaiApiKey };
    } else {
      throw new Error(`Please set either GEMINI_API_KEY or OPENAI_API_KEY environment variable.
You can get API KEY for Gemini from https://aistudio.google.com/
            `);
    }
  }

  private async getTokenCountToGemini(prompt: string): Promise<number> {
    const genAI = new GoogleGenerativeAI(this.geminiApiKey);
    const gemini = genAI.getGenerativeModel({
      model: this.currentModel,
    });
    return (await gemini.countTokens(prompt)).totalTokens;
  }

  private async getTokenCountToOpenAI(prompt: string): Promise<number> {
    const encoder = encoding_for_model('gpt-4');

    const tokens = encoder.encode(prompt);
    encoder.free();
    return tokens.length;
  }
}
