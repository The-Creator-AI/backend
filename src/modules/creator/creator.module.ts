import { Module } from '@nestjs/common';
import { CreatorController } from './creator.controller';
import { CreatorService } from './creator.service';
import { LlmService } from './llm.service';
import { CreatorGateway } from './creator.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanEntity } from './entities/plan.entity';
import { PlanRepository } from './repositories/plan.repository';

@Module({
  imports: [TypeOrmModule.forFeature([PlanEntity])],
  controllers: [CreatorController],
  providers: [CreatorGateway, CreatorService, LlmService, PlanRepository],
  exports: [LlmService],
})
export class CreatorModule {}
