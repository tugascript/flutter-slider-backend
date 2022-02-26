import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, Min } from 'class-validator';

@InputType('RecordInput')
export abstract class RecordInput {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  public level!: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  public moves!: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  public time!: number;
}
