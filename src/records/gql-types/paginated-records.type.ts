import { ObjectType } from '@nestjs/graphql';
import { Paginated } from '../../common/gql-types/paginated.type';
import { RecordEntity } from '../entities/record.entity';

@ObjectType('PaginatedRecords')
export class PaginatedRecordsType extends Paginated(RecordEntity) {}
