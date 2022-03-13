import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { RecordEntity } from '../records/entities/record.entity';
import { UserEntity } from '../users/entities/user.entity';
import { DataloadersService } from './dataloaders.service';

@Module({
  imports: [MikroOrmModule.forFeature([UserEntity, RecordEntity])],
  providers: [DataloadersService],
  exports: [DataloadersService],
})
export class DataloadersModule {}
