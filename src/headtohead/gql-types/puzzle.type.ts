import { Field, ObjectType } from '@nestjs/graphql';
import { PuzzleStatusEnum } from '../enum/puzzle-status.enum';
import { PieceType } from './piece.type';
import { PositionType } from './position.type';

@ObjectType('Game')
export class PuzzleType {
  @Field(() => [[PieceType]])
  public puzzle!: PieceType[][];

  @Field(() => PuzzleStatusEnum)
  public status!: PuzzleStatusEnum;

  @Field(() => PositionType)
  public next!: PositionType;

  constructor({ puzzle, status, next }: PuzzleType) {
    this.puzzle = puzzle;
    this.status = status;
    this.next = next;
  }
}
