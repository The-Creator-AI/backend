import { Injectable } from '@nestjs/common';
import * as openai from 'openai';
import { encoding_for_model } from 'tiktoken';

@Injectable()
export class OpenAIService {
  private openaiModel: string = 'gpt-4o-mini';
  private readonly openaiApiKey: string | undefined =
    process.env.OPENAI_API_KEY;

  async sendPrompt(
    prompt: string,
    on?: { chunk?: (chunk: string) => void },
  ): Promise<string> {
    if (!this.openaiApiKey) {
      throw new Error('OPENAI_API_KEY not set in environment variables.');
    }

    const model = new openai.OpenAI({
      apiKey: this.openaiApiKey,
    });

    const response = await model.chat.completions.create({
      model: this.openaiModel,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });

    let responseText = '';
    for await (const chunk of response) {
      on?.chunk && on.chunk(chunk.choices[0].delta?.content || '');
      responseText += chunk.choices[0].delta?.content || '';
    }
    return responseText;
  }

  async getTokenCount(prompt: string): Promise<number> {
    const encoder = encoding_for_model('gpt-4');

    const tokens = encoder.encode(prompt);
    encoder.free();
    return tokens.length;
  }
}
