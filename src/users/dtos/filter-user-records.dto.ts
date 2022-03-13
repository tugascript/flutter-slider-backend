import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsEnum, IsInt, Max, Min } from 'class-validator';
import { QueryOrderEnum } from '../../common/enums/query-order.enum';

@ArgsType()
export abstract class FilterUserRecordsDto {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(10)
  public level!: number;

  @Field(() => Int, { defaultValue: 10 })
  @IsInt()
  @Min(1)
  @Max(50)
  public first = 10;

  @Field(() => QueryOrderEnum, { defaultValue: QueryOrderEnum.ASC })
  @IsEnum(QueryOrderEnum)
  public order: QueryOrderEnum = QueryOrderEnum.ASC;
}
