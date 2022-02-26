import { registerEnumType } from '@nestjs/graphql';

export enum DifficultyEnum {
  easy = 'easy',
  medium = 'medium',
  hard = 'hard',
}

registerEnumType(DifficultyEnum, { name: 'Difficulty' });
