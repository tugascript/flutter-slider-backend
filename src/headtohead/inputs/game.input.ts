import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsInt, Max, Min } from 'class-validator';
import { DifficultyEnum } from '../enum/difficulty.enum';

@InputType('GameInput')
export abstract class GameInput {
  @Field(() => DifficultyEnum)
  @IsEnum(DifficultyEnum)
  public difficulty!: DifficultyEnum;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(5)
  public level!: number;
}
