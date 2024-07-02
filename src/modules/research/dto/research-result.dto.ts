import { GoogleSearchResult } from './google-search-result.dto';

export interface ResearchResult {
  metaSummary: string;
  summarizedResults: (GoogleSearchResult & {
    llmSummary: string;
  })[];
}
