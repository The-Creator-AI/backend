import { SummarizedResult } from './summarized-result.dto';

export interface ResearchResult {
  metaSummary: string;
  summarizedResults: SummarizedResult[];
}
