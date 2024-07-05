import { Module } from '@nestjs/common';
import { CreatorController } from './creator.controller';
import { CreatorService } from './creator.service';
import { LlmService } from './llm.service';
import { CreatorGateway } from './creator.gateway';

@Module({
  controllers: [CreatorController],
  providers: [CreatorService, LlmService, CreatorGateway],
  exports: [LlmService],
})
export class CreatorModule {}
