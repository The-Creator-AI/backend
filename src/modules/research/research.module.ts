import { Module } from '@nestjs/common';
import { ResearchController } from './research.controller';
import { ResearchService } from './research.service';
import { CreatorModule } from '../creator/creator.module';
import { CommonModule } from '../common/common.module';
import { ResearchGateway } from './research.gateway';

@Module({
  imports: [CreatorModule, CommonModule],
  controllers: [ResearchController],
  providers: [ResearchService, ResearchGateway],
  exports: [ResearchService],
})
export class ResearchModule {}
