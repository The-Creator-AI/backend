import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CreatorModule } from './creator/creator.module';

@Module({
  imports: [CreatorModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
