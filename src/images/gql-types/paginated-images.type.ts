import { ObjectType } from '@nestjs/graphql';
import { Paginated } from '../../common/gql-types/paginated.type';
import { ImageEntity } from '../entities/image.entity';

@ObjectType('PaginatedImages')
export abstract class PaginatedImagesType extends Paginated(ImageEntity) {}
