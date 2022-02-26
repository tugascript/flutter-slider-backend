import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { RecordEntity } from './entities/record.entity';
import { RecordsService } from './records.service';
import { RecordsResolver } from './records.resolver';

@Module({
  imports: [MikroOrmModule.forFeature([RecordEntity]), UsersModule],
  providers: [RecordsService, RecordsResolver],
  exports: [RecordsService],
})
export class RecordsModule {}
