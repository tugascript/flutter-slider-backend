import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { LocalMessageType } from '../common/gql-types/message.type';
import { IPaginated } from '../common/interfaces/paginated.interface';
import { DeleteImageDto } from './dto/delete-image.dto';
import { ImageUploadDto } from './dto/image-upload.dto';
import { ImageEntity } from './entities/image.entity';
import { PaginatedImagesType } from './gql-types/paginated-images.type';
import { ImagesService } from './images.service';

@Resolver(() => ImageEntity)
export class ImagesResolver {
  constructor(private readonly imagesService: ImagesService) {}

  @Mutation(() => ImageEntity)
  public async addImage(
    @CurrentUser() userId: number,
    @Args() dto: ImageUploadDto,
  ): Promise<ImageEntity> {
    return this.imagesService.createImage(userId, dto);
  }

  @Mutation(() => LocalMessageType)
  public async deleteImage(
    @CurrentUser() userId: number,
    @Args() dto: DeleteImageDto,
  ): Promise<LocalMessageType> {
    return this.imagesService.deleteImage(userId, dto);
  }

  @Query(() => PaginatedImagesType)
  public async getImages(
    @CurrentUser() userId: number,
    @Args() dto: PaginationDto,
  ): Promise<IPaginated<ImageEntity>> {
    return this.imagesService.getImages(userId, dto);
  }
}
