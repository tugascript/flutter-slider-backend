import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsInt, Max, Min } from 'class-validator';

@ArgsType()
export abstract class NewGameDto {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(5)
  public level!: number;
}
