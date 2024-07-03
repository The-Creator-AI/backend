import { Injectable } from '@nestjs/common';
import { LlmService } from '../creator/llm.service';
import { ResearchResult } from './dto/research-result.dto';
import axios from 'axios';
import { GoogleSearchResult } from './dto/google-search-result.dto';
import { BrowserService } from '../common/browser.service';

@Injectable()
export class ResearchService {
  private readonly googleSearchKey: string | undefined =
    process.env.GOOGLE_SEARCH__KEY;
  private readonly googleSearchEngineId: string | undefined =
    process.env.GOOGLE_SEARCH__ENGINE_ID;
  constructor(
    private readonly llmService: LlmService,
    private readonly browserService: BrowserService,
  ) {
    this.browserService.initialize();
  }

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

    const response = await axios.get(
      `https://www.googleapis.com/customsearch/v1?key=${this.googleSearchKey}&cx=${this.googleSearchEngineId}&q=${topic}`,
    );

    return response.data.items || [];
  }

  // Implement summarization using your LLM service for each result
  private async summarizeEachResult(
    searchResults: GoogleSearchResult[],
  ): Promise<(GoogleSearchResult & { llmSummary: string })[]> {
    const promises = searchResults.map(async (result) => {
      try {
        const textContent = await this.fetchTextContent(result.link);
        const summary = await this.llmService.summarize(textContent);
        return {
          ...result,
          llmSummary: summary,
        };
      } catch (error) {
        console.error(`Error fetching content for ${result.link}: ${error}`);
        return { ...result, llmSummary: 'Error fetching content' }; // Return a placeholder summary if there's an error
      }
    });

    return Promise.all(promises); // Wait for all summaries to be fetched
  }

  // Implement fetching text content from a URL
  private async fetchTextContent(url: string): Promise<string> {
    const page = await this.browserService.getTab();
    await page.goto(url);

    try {
      await page.waitForNavigation();
    } catch (e) {
      console.error(e);
    }
    // Wait for any JavaScript to load, using setTimeout
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const textContent = await page.$eval('body', (el) => el.textContent);

    await this.browserService.releaseTab(page);
    return textContent;
  }

  // Implement summarization using your LLM service for the summaries
  private async summarizeResults(
    summaries: (GoogleSearchResult & { llmSummary: string })[],
  ): Promise<string> {
    const filteredSummaries = summaries.filter(
      (summary) => summary.llmSummary !== 'Error fetching content',
    ); // Filter out placeholder summaries
    return this.llmService.summarize(
      filteredSummaries
        .map(
          (summary) =>
            `Title: ${summary.title}\nSummary: \n\n${summary.llmSummary}`,
        )
        .join('\n\n'),
    );
  }
}
