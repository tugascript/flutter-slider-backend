import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { GameEntity } from './entities/game.entity';
import { HeadtoheadResolver } from './headtohead.resolver';
import { HeadtoheadService } from './headtohead.service';

@Module({
  imports: [MikroOrmModule.forFeature([GameEntity])],
  providers: [HeadtoheadService, HeadtoheadResolver],
})
export class HeadtoheadModule {}
