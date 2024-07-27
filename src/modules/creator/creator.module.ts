import { Module } from '@nestjs/common';
import { CreatorController } from './creator.controller';
import { CreatorService } from './creator.service';
import { LlmService } from './llm.service';
import { CreatorGateway } from './creator.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanEntity } from './entities/plan.entity';
import { PlanRepository } from './repositories/plan.repository';
import { ChatRepository } from './repositories/chat.repository';
import { ChatEntity } from './entities/chat.entity';
import { GeminiService } from './llm-services/gemini.service';
import { OpenAIService } from './llm-services/openai.service';
import { ClaudeService } from './llm-services/claude.service';

@Module({
  imports: [TypeOrmModule.forFeature([PlanEntity, ChatEntity])],
  controllers: [CreatorController],
  providers: [
    CreatorGateway,
    CreatorService,
    LlmService,
    GeminiService,
    OpenAIService,
    ClaudeService,
    PlanRepository,
    ChatRepository,
  ],
  exports: [LlmService],
})
export class CreatorModule {}
