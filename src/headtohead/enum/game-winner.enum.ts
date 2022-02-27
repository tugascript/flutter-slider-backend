import { registerEnumType } from '@nestjs/graphql';

export enum GameWinnerEnum {
  host = 'host',
  challenger = 'challenger',
  unsettled = 'unsettled',
}

registerEnumType(GameWinnerEnum, {
  name: 'GameWinner',
});
