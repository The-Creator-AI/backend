import { Controller, Post, Body } from '@nestjs/common';
import { ResearchService } from './research.service';
import { ResearchResult } from './dto/research-result.dto';

@Controller('research')
export class ResearchController {
  constructor(private readonly researchService: ResearchService) {}

  @Post()
  async research(
    @Body() { query }: { query: string },
  ): Promise<ResearchResult> {
    const results = await this.researchService.searchAndSummarize(query);
    return results;
  }
}
