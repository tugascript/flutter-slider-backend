import { PuzzleType } from '../gql-types/puzzle.type';

export interface IMovePiece {
  userUuid: string;
  puzzle: PuzzleType;
}
