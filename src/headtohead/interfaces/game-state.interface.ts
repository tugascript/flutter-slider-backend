import { PuzzleType } from '../gql-types/puzzle.type';

export interface IGameState {
  hostId: string;
  challengerId: string;
  puzzle: PuzzleType;
}
