import { registerEnumType } from '@nestjs/graphql';

export enum GameWinnerEnum {
  defaultHost = 'defaultHost',
  defaultChallenger = 'defaultChallenger',
  host = 'host',
  challenger = 'challenger',
  unsettled = 'unsettled',
  draw = 'draw',
}

registerEnumType(GameWinnerEnum, {
  name: 'GameWinner',
});
