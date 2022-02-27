import { registerEnumType } from '@nestjs/graphql';

export enum GameWinnerEnum {
  default_host = 'default_host',
  default_challenger = 'default_challenger',
  host = 'host',
  challenger = 'challenger',
  unsettled = 'unsettled',
  draw = 'draw',
}

registerEnumType(GameWinnerEnum, {
  name: 'GameWinner',
});
