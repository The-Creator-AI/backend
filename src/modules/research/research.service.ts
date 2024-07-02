import { Injectable } from '@nestjs/common';
import { LlmService } from '../creator/llm.service';
import { ResearchResult } from './dto/research-result.dto';
import axios from 'axios';
import { GoogleSearchResult } from './dto/google-search-result.dto';

@Injectable()
export class ResearchService {
  private readonly googleSearchKey: string | undefined =
    process.env.GOOGLE_SEARCH__KEY;
  private readonly googleSearchEngineId: string | undefined =
    process.env.GOOGLE_SEARCH__ENGINE_ID;
  constructor(private readonly llmService: LlmService) {}

  async searchAndSummarize(topic: string): Promise<ResearchResult> {
    const searchResults = await this.fetchSearchResults(topic); // Implement search functionality (Google API)
    const summarizedResults = await this.summarizeResults(searchResults); // Use LLM to summarize
    console.log({
      summarizedResults,
      searchResults: JSON.stringify(searchResults, null, 2),
    });
    return {
      summary: summarizedResults,
      sources: searchResults.map((result) => ({
        title: result.title,
        url: result.link,
      })),
    };
  }

  // Implement search functionality using a search engine API (Google, Bing, etc.)
  private async fetchSearchResults(
    topic: string,
  ): Promise<GoogleSearchResult[]> {
    if (!this.googleSearchKey || !this.googleSearchEngineId) {
      throw new Error('Missing Google Custom Search API key or engine ID');
    }

    const response = await axios.get(
      `https://www.googleapis.com/customsearch/v1?key=${this.googleSearchKey}&cx=${this.googleSearchEngineId}&q=${topic}`,
    );

    return response.data.items || [];
  }

  // Implement summarization using your LLM service
  private async summarizeResults(
    searchResults: GoogleSearchResult[],
  ): Promise<string> {
    const searchResultTexts = searchResults.map((result) => result.snippet);
    return this.llmService.summarize(searchResultTexts.join('\n\n'));
  }
}
