import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { IPaginated } from '../common/interfaces/paginated.interface';
import { RecordEntity } from './entities/record.entity';
import { PaginatedRecords } from './gql-types/paginated-records.entity';
import { GetRecordsInput } from './inputs/get-records.input';
import { RecordInput } from './inputs/record.input';
import { RecordsService } from './records.service';

@Resolver()
export class RecordsResolver {
  constructor(private readonly recordsService: RecordsService) {}

  @Mutation(() => RecordEntity)
  public async createRecord(
    @CurrentUser() userId: number,
    @Args('input') input: RecordInput,
  ): Promise<RecordEntity> {
    return this.recordsService.createRecord(userId, input);
  }

  @Public()
  @Query(() => PaginatedRecords)
  public async getRecords(
    @Args('input') input: GetRecordsInput,
  ): Promise<IPaginated<RecordEntity>> {
    return this.recordsService.getRecords(input);
  }
}
