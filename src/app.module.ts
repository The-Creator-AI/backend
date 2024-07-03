import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CreatorModule } from './modules/creator/creator.module';
import { ResearchModule } from './modules/research/research.module';
import { CommonModule } from './modules/common/common.module';

@Module({
  imports: [CreatorModule, ResearchModule, CommonModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
