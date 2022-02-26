import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { PuzzleStatusEnum } from './enum/puzzle-status.enum';
import { PuzzleType } from './gql-types/puzzle.type';
import { PieceType } from './gql-types/piece.type';
import { PositionType } from './gql-types/position.type';
import { GameInput } from './inputs/game.input';

@Injectable()
export class HeadtoheadService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  public async newGame(
    userId: number,
    { level, difficulty }: GameInput,
  ): Promise<PuzzleType> {
    const len = level + 2;
    const puzzle: PieceType[][] = [];

    for (let i = 0; i < len; i++) {
      const row: PieceType[] = [];

      for (let j = 0; j < len; j++) {
        const pos = new PositionType(i, j);
        row.push(new PieceType(pos));
      }

      puzzle.push(row);
    }

    const index = len - 1;
    puzzle[index][index].empty = true;

    return new PuzzleType({
      difficulty,
      level,
      puzzle,
      status: PuzzleStatusEnum.starting,
      next: new PositionType(index, index),
    });
  }
}
