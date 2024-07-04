import { Controller, Post, Body } from '@nestjs/common';
import { ResearchService } from './research.service';
import { ResearchResult } from './dto/research-result.dto';

@Controller('research')
export class ResearchController {
  constructor(private readonly researchService: ResearchService) {}

  @Post()
  async research(@Body('topic') topic: string): Promise<ResearchResult> {
    try {
      const results = await Promise.all(
        await this.researchService.searchAndSummarize(topic),
      );

      // Create the meta summary after collecting all results
      const metaSummary = await this.researchService.summarizeResults(results);

      return { metaSummary, summarizedResults: results };
    } catch (error) {
      console.error('Error during research:', error);
      throw error; // Re-throw to trigger a 500 Internal Server Error response
    }
  }
}
