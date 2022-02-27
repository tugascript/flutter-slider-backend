import { Field, Int, ObjectType } from '@nestjs/graphql';
import { IPuzzleConstructor } from '../interfaces/puzzle-constructor.interface';
import { PieceType } from './piece.type';
import { PositionType } from './position.type';

@ObjectType('Puzzle')
export class PuzzleType {
  @Field(() => [[PieceType]])
  public puzzle!: PieceType[][];

  @Field(() => Boolean)
  public completed = false;

  @Field(() => PositionType)
  public next!: PositionType;

  @Field(() => Int)
  public time!: number;

  constructor({ puzzle, next, time }: IPuzzleConstructor) {
    this.puzzle = puzzle;
    this.next = next;
    this.time = time;
  }
}
