import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsInt, Min } from 'class-validator';

@ArgsType()
export abstract class DeleteImageDto {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  public imageId!: number;
}
