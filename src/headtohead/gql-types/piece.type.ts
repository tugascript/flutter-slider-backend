import { Field, ObjectType } from '@nestjs/graphql';
import { PositionType } from './position.type';

@ObjectType('Piece')
export class PieceType {
  @Field(() => PositionType)
  public position!: PositionType;

  @Field(() => Boolean)
  public empty = false;

  constructor(position: PositionType) {
    this.position = position;
  }
}
