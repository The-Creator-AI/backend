import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CreatorModule } from './modules/creator/creator.module';
import { ResearchModule } from './modules/research/research.module';
import { CommonModule } from './modules/common/common.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: '~/creator-ai.sqlite',
      autoLoadEntities: true, // Load all entities automatically
      synchronize: true, // Automatically synchronize the database schema
      logging: ['error'], // Log only errors to the console
      entities: [],
      migrationsTableName: 'migration',
      migrations: ['src/migrations/{.ts,.js}'],
    }),
    CreatorModule,
    ResearchModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
