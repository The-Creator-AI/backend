import { Module } from '@nestjs/common';
import { ResearchController } from './research.controller';
import { ResearchService } from './research.service';
import { CreatorModule } from '../creator/creator.module';

@Module({
  imports: [CreatorModule],
  controllers: [ResearchController],
  providers: [ResearchService],
})
export class ResearchModule {}
