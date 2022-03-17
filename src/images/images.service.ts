import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { CommonService } from '../common/common.service';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { QueryOrderEnum } from '../common/enums/query-order.enum';
import { LocalMessageType } from '../common/gql-types/message.type';
import { IPaginated } from '../common/interfaces/paginated.interface';
import { UploaderService } from '../uploader/uploader.service';
import { DeleteImageDto } from './dto/delete-image.dto';
import { ImageUploadDto } from './dto/image-upload.dto';
import { ImageEntity } from './entities/image.entity';

@Injectable()
export class ImagesService {
  constructor(
    @InjectRepository(ImageEntity)
    private readonly imagesRepository: EntityRepository<ImageEntity>,
    private readonly uploaderService: UploaderService,
    private readonly commonService: CommonService,
  ) {}

  /**
   * Create Image
   *
   * Image create CRUD operation. Takes an image and uploads it to object
   * storage.
   */
  public async createImage(
    userId: number,
    { image }: ImageUploadDto,
  ): Promise<ImageEntity> {
    const url = await this.uploaderService.uploadImage(userId, image, 1);
    const imageEntity = this.imagesRepository.create({
      owner: userId,
      url,
    });
    await this.commonService.validateEntity(imageEntity);
    await this.commonService.throwInternalError(
      this.imagesRepository.persistAndFlush(imageEntity),
    );
    return imageEntity;
  }

  /**
   * Delete Image
   *
   * Image delete CRUD operation. Takes an image id, finds it and removes it
   * from db and object storage.
   */
  public async deleteImage(
    userId: number,
    { imageId }: DeleteImageDto,
  ): Promise<LocalMessageType> {
    const image = await this.getImageById(userId, imageId);
    const imageUrl = image.url;

    await this.commonService.throwInternalError(
      this.imagesRepository.removeAndFlush(image),
    );
    await this.commonService.throwInternalError(
      this.uploaderService.deleteFile(imageUrl),
    );
    return new LocalMessageType('Image deleted successfully');
  }

  /**
   * Get Images
   *
   * Image read multiple CRUD operation. Gets cursor paginated user's images.
   */
  public async getImages(
    userId: number,
    { first, after }: PaginationDto,
  ): Promise<IPaginated<ImageEntity>> {
    const name = 'i';
    const qb = this.imagesRepository
      .createQueryBuilder(name)
      .where({ owner: userId });

    return await this.commonService.queryBuilderPagination(
      name,
      'id',
      first,
      QueryOrderEnum.ASC,
      qb,
      after,
      true,
    );
  }

  /**
   * Get Image By ID
   *
   * Image read CRUD operation. Takes an image id and returns it from the db.
   */
  private async getImageById(
    userId: number,
    imageId: number,
  ): Promise<ImageEntity> {
    const image = await this.imagesRepository.findOne({
      id: imageId,
      owner: userId,
    });
    this.commonService.checkExistence('Image', image);
    return image;
  }
}
