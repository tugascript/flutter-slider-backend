import { PieceType } from '../gql-types/piece.type';
import { PositionType } from '../gql-types/position.type';

export interface IPuzzleConstructor {
  puzzle: PieceType[][];
  next: PositionType;
  time: number;
}
