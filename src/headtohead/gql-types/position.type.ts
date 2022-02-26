import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('Position')
export class PositionType {
  @Field(() => Int)
  public row!: number;

  @Field(() => Int)
  public column!: number;

  constructor(row: number, column: number) {
    this.row = row;
    this.column = column;
  }
}
