import { MikroOrmModule } from '@mikro-orm/nestjs';
import { forwardRef, Module } from '@nestjs/common';
import { RecordsModule } from '../records/records.module';
import { UploaderModule } from '../uploader/uploader.module';
import { UserEntity } from './entities/user.entity';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([UserEntity]),
    UploaderModule,
    forwardRef(() => RecordsModule),
  ],
  providers: [UsersService, UsersResolver],
  exports: [UsersService],
})
export class UsersModule {}
