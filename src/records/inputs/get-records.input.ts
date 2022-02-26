import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { QueryOrderEnum } from 'src/common/enums/query-order.enum';
import { PaginationDto } from '../../common/dtos/pagination.dto';

@InputType('GetRecordsInput')
export abstract class GetRecordsInput extends PaginationDto {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  public userId!: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(1)
  @IsOptional()
  public level?: number;

  @Field(() => QueryOrderEnum, { defaultValue: QueryOrderEnum.DESC })
  @IsEnum(QueryOrderEnum)
  public order: QueryOrderEnum = QueryOrderEnum.DESC;
}
