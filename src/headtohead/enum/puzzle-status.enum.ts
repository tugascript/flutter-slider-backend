import { registerEnumType } from '@nestjs/graphql';

export enum PuzzleStatusEnum {
  starting = 'starting',
  ongoing = 'ongoing',
  paused = 'paused',
  completed = 'completed',
  lost = 'lost',
}

registerEnumType(PuzzleStatusEnum, {
  name: 'PuzzleStatus',
});
