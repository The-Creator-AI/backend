import { Injectable } from '@nestjs/common';
import { CreatorService } from './creator.service';
import { GeminiService } from './llm-services/gemini.service';
import { OpenAIService } from './llm-services/openai.service';
import { ClaudeService } from './llm-services/claude.service';

@Injectable()
export class LlmService {
  private readonly geminiApiKey: string | undefined =
    process.env.GEMINI_API_KEY;
  private readonly openaiApiKey: string | undefined =
    process.env.OPENAI_API_KEY;
  private readonly claudeApiKey: string | undefined =
    process.env.CLAUDE_API_KEY;

  private currentModel: string = 'gemini-1.5-pro-latest'; // Default model

  constructor(
    private readonly creatorService: CreatorService,
    private readonly geminiService: GeminiService,
    private readonly openAIService: OpenAIService,
    private readonly claudeService: ClaudeService,
  ) {}

  private async buildPrompt(
    chatHistory: { user: string; message: string }[],
    selectedFiles: string[] = [],
  ): Promise<string> {
    const fileContents =
      this.creatorService.readSelectedFilesContent(selectedFiles);

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
    const { type } = this.getApiKey();

    switch (type) {
      case 'gemini':
        return this.geminiService.sendPrompt(prompt, { chunk: on?.chunk });
      case 'openai':
        return this.openAIService.sendPrompt(prompt, { chunk: on?.chunk });
      case 'claude':
        return this.claudeService.sendPrompt(prompt, { chunk: on?.chunk });
      default:
        throw new Error(
          'No API key found. Please set either GEMINI_API_KEY, OPENAI_API_KEY, or CLAUDE_API_KEY environment variable.',
        );
    }
  }

  async getTokenCount(
    chatHistory: { user: string; message: string }[],
    selectedFiles: string[] = [],
  ): Promise<number> {
    const prompt = await this.buildPrompt(chatHistory, selectedFiles);
    const { type } = this.getApiKey();

    switch (type) {
      case 'gemini':
        return this.geminiService.getTokenCount(prompt);
      case 'openai':
        return this.openAIService.getTokenCount(prompt);
      case 'claude':
        return this.claudeService.getTokenCount(prompt);
      default:
        throw new Error(
          'No API key found. Please set either GEMINI_API_KEY, OPENAI_API_KEY, or CLAUDE_API_KEY environment variable.',
        );
    }
  }

  async summarize(
    text: string,
    on?: { chunk?: (chunk: string) => void },
  ): Promise<string> {
    const prompt = `Summarize this text: \n\n\n${text}`;
    const { type } = this.getApiKey();

    switch (type) {
      case 'gemini':
        return this.geminiService.sendPrompt(prompt, { chunk: on?.chunk });
      case 'openai':
        return this.openAIService.sendPrompt(prompt);
      case 'claude':
        return this.claudeService.sendPrompt(prompt, { chunk: on?.chunk });
      default:
        throw new Error(
          'No API key found. Please set either GEMINI_API_KEY, OPENAI_API_KEY, or CLAUDE_API_KEY environment variable.',
        );
    }
  }

  getModelName(): string {
    return this.currentModel;
  }

  private getApiKey() {
    if (this.geminiApiKey && this.openaiApiKey && this.claudeApiKey) {
      console.warn('Multiple API keys found. Defaulting to GEMINI_API_KEY.');
    }

    if (this.geminiApiKey) {
      this.currentModel = 'gemini-1.5-pro-latest';
      return { type: 'gemini', apiKey: this.geminiApiKey };
    } else if (this.openaiApiKey) {
      this.currentModel = 'gpt-4o-mini';
      return { type: 'openai', apiKey: this.openaiApiKey };
    } else if (this.claudeApiKey) {
      this.currentModel = 'claude-3.5-sonnet';
      return { type: 'claude', apiKey: this.claudeApiKey };
    } else {
      throw new Error(
        'Please set either GEMINI_API_KEY, OPENAI_API_KEY, or CLAUDE_API_KEY environment variable. You can get an API KEY for Gemini from https://aistudio.google.com/',
      );
    }
  }
}
