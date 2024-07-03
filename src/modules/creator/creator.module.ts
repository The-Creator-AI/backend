import { Module } from '@nestjs/common';
import { CreatorController } from './creator.controller';
import { CreatorService } from './creator.service';
import { LlmService } from './llm.service';

@Module({
  controllers: [CreatorController],
  providers: [CreatorService, LlmService],
  exports: [LlmService],
})
export class CreatorModule {}