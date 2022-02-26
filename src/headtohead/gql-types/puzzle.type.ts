import { Field, Int, ObjectType } from '@nestjs/graphql';
import { DifficultyEnum } from '../enum/difficulty.enum';
import { PuzzleStatusEnum } from '../enum/puzzle-status.enum';
import { PieceType } from './piece.type';
import { PositionType } from './position.type';

@ObjectType('Game')
export class PuzzleType {
  @Field(() => DifficultyEnum)
  public difficulty!: DifficultyEnum;

  @Field(() => Int)
  public level!: number;

  @Field(() => [[PieceType]])
  public puzzle!: PieceType[][];

  @Field(() => PuzzleStatusEnum)
  public status!: PuzzleStatusEnum;

  @Field(() => PositionType)
  public next!: PositionType;

  constructor({ difficulty, level, puzzle, status, next }: PuzzleType) {
    this.difficulty = difficulty;
    this.level = level;
    this.puzzle = puzzle;
    this.status = status;
    this.next = next;
  }
}
