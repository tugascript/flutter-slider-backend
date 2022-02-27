import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, Min } from 'class-validator';

@InputType('PositionInput')
export abstract class PositionInput {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  public gameId!: number;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  public row!: number;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  public column!: number;
}
