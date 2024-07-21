import { Module } from '@nestjs/common';
import { SQLDBService } from './sqldb.service';

@Module({
  imports: [],
  controllers: [],
  providers: [SQLDBService],
  exports: [SQLDBService],
})
export class SQLDBModule {}
