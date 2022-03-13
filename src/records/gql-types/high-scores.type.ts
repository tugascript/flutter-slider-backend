import { Field, Int, ObjectType } from '@nestjs/graphql';
import { IPaginated } from '../../common/interfaces/paginated.interface';
import { RecordEntity } from '../entities/record.entity';
import { PaginatedRecordsType } from './paginated-records.type';

@ObjectType('HighScores')
export class HighScoresType {
  @Field(() => PaginatedRecordsType)
  public records!: IPaginated<RecordEntity>;

  @Field(() => RecordEntity, { nullable: true })
  public currentRecord?: RecordEntity;

  @Field(() => Int, { nullable: true })
  public currentRank?: number;

  constructor(
    records: IPaginated<RecordEntity>,
    currentRecord?: RecordEntity,
    currentRank?: number,
  ) {
    this.records = records;
    this.currentRecord = currentRecord;
    this.currentRank = currentRank;
  }
}
