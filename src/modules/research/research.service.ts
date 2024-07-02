import { Injectable } from '@nestjs/common';
import { LlmService } from '../creator/llm.service';
import { ResearchResult } from './dto/research-result.dto';
import axios from 'axios';
import { GoogleSearchResult } from './dto/google-search-result.dto';
import * as cheerio from 'cheerio';

type UnPromise<T> = T extends Promise<infer U> ? U : T;

@Injectable()
export class ResearchService {
  private readonly googleSearchKey: string | undefined =
    process.env.GOOGLE_SEARCH__KEY;
  private readonly googleSearchEngineId: string | undefined =
    process.env.GOOGLE_SEARCH__ENGINE_ID;
  constructor(private readonly llmService: LlmService) {}

  async searchAndSummarize(topic: string): Promise<ResearchResult> {
    const searchResults = await this.fetchSearchResults(topic);
    const summarizedResults = await this.summarizeEachResult(searchResults);
    const metaSummary = await this.summarizeResults(summarizedResults);

    return {
      metaSummary,
      summarizedResults,
    };
  }

  // Implement search functionality using a search engine API (Google, Bing, etc.)
  private async fetchSearchResults(
    topic: string,
  ): Promise<GoogleSearchResult[]> {
    if (!this.googleSearchKey || !this.googleSearchEngineId) {
      throw new Error('Missing Google Custom Search API key or engine ID');
    }

    const url = `https://www.googleapis.com/customsearch/v1?key=${this.googleSearchKey}&cx=${this.googleSearchEngineId}&q=${encodeURIComponent(
      topic,
    )}`;
    console.log(`Fetching search results from ${url}`);
    const response = await axios.get(url);

    return response.data.items || [];
  }

  // Implement summarization using your LLM service for each result
  private async summarizeEachResult(searchResults: GoogleSearchResult[]) {
    const summaries: (GoogleSearchResult & { llmSummary: string })[] =
      [] as any;

    for (const result of searchResults) {
      try {
        console.log(`Fetching content for ${result.link}`);
        const textContent = await this.fetchTextContent(result.link);
        console.log(`Fetched content is of length ${textContent.length}`);
        const summary = await this.llmService.summarize(textContent);
        console.log(`Summarized content is of length ${summary.length}`);
        summaries.push({
          ...result,
          llmSummary: summary,
        });
      } catch (error) {
        console.error(`Error fetching content for ${result.link}: ${error}`);
      }
    }

    return summaries;
  }

  // Implement fetching text content from a URL
  private async fetchTextContent(url: string): Promise<string> {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    return $('body').text(); // Extract text from the <body> element
  }

  // Implement summarization using your LLM service for the summaries
  private async summarizeResults(
    summaries: UnPromise<ReturnType<typeof this.summarizeEachResult>>,
  ): Promise<string> {
    return this.llmService.summarize(
      summaries
        .map(
          (summary) =>
            `Title: ${summary.title}\nSummary: \n\n${summary.llmSummary}`,
        )
        .join('\n\n'),
    );
  }
}
