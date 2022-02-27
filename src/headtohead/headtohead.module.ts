import { MikroOrmModule } from '@mikro-orm/nestjs';
import { forwardRef, Module } from '@nestjs/common';
import { UploaderModule } from '../uploader/uploader.module';
import { UsersModule } from '../users/users.module';
import { GameEntity } from './entities/game.entity';
import { HeadtoheadResolver } from './headtohead.resolver';
import { HeadtoheadService } from './headtohead.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([GameEntity]),
    UploaderModule,
    forwardRef(() => UsersModule),
  ],
  providers: [HeadtoheadService, HeadtoheadResolver],
})
export class HeadtoheadModule {}
