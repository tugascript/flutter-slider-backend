import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { UploaderModule } from '../uploader/uploader.module';
import { ImageEntity } from './entities/image.entity';
import { ImagesService } from './images.service';
import { ImagesResolver } from './images.resolver';

@Module({
  imports: [MikroOrmModule.forFeature([ImageEntity]), UploaderModule],
  providers: [ImagesService, ImagesResolver],
})
export class ImagesModule {}
