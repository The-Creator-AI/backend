import { GoogleSearchResult } from './google-search-result.dto';

export interface SummarizedResult extends GoogleSearchResult {
  llmSummary: string;
}
