import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { RecordEntity } from './entities/record.entity';
import { RecordsResolver } from './records.resolver';
import { RecordsService } from './records.service';

@Module({
  imports: [MikroOrmModule.forFeature([RecordEntity]), UsersModule],
  providers: [RecordsService, RecordsResolver],
  exports: [RecordsService],
})
export class RecordsModule {}
