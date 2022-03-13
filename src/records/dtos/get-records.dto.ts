import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsEnum, IsInt, Min } from 'class-validator';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { QueryOrderEnum } from '../../common/enums/query-order.enum';

@ArgsType()
export abstract class GetRecordsDto extends PaginationDto {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  public userId!: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  public level!: number;

  @Field(() => QueryOrderEnum, { defaultValue: QueryOrderEnum.ASC })
  @IsEnum(QueryOrderEnum)
  public order: QueryOrderEnum = QueryOrderEnum.ASC;
}
