import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsInt, Max, Min } from 'class-validator';
import { PaginationDto } from '../../common/dtos/pagination.dto';

@ArgsType()
export abstract class LevelDto extends PaginationDto {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(10)
  public level!: number;
}
