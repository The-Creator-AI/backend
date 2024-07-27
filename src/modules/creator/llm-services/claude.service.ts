import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import * as anthropicTokenCounter from '@anthropic-ai/tokenizer';

@Injectable()
export class ClaudeService {
  private claudeModel: string = 'claude-3.5-sonnet';
  private readonly claudeApiKey: string | undefined =
    process.env.CLAUDE_API_KEY;

  async sendPrompt(
    prompt: string,
    on?: { chunk?: (chunk: string) => void },
  ): Promise<string> {
    if (!this.claudeApiKey) {
      throw new Error('CLAUDE_API_KEY not set in environment variables.');
    }

    const client = new Anthropic({
      apiKey: this.claudeApiKey,
    });

    const response = await client.messages
      .stream({
        model: this.claudeModel,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      })
      .on('text', (chunk) => {
        on?.chunk && on.chunk(chunk);
      });

    const finalMessage = await response.finalMessage();
    return finalMessage.content[0].type === 'text'
      ? finalMessage.content[0].text
      : 'Failed to parse Claude response!';
  }

  async getTokenCount(prompt: string): Promise<number> {
    return anthropicTokenCounter.countTokens(prompt);
  }
}
