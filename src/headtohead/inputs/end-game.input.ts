import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsInt, Max, Min } from 'class-validator';
import { GameWinnerEnum } from '../enum/game-winner.enum';

@InputType('EndGameInput')
export abstract class EndGameInput {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  public gameId!: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(3000)
  public time!: number;

  @Field(() => GameWinnerEnum)
  @IsEnum(GameWinnerEnum)
  public winner!: GameWinnerEnum;
}
