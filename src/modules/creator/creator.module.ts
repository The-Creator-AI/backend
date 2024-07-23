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

@Module({
  imports: [TypeOrmModule.forFeature([PlanEntity, ChatEntity])],
  controllers: [CreatorController],
  providers: [
    CreatorGateway,
    CreatorService,
    LlmService,
    PlanRepository,
    ChatRepository,
  ],
  exports: [LlmService],
})
export class CreatorModule {}
