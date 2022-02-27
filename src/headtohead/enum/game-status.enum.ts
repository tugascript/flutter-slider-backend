import { registerEnumType } from '@nestjs/graphql';

export enum GameStatusEnum {
  new = 'new',
  on = 'on',
  done = 'done',
}

registerEnumType(GameStatusEnum, {
  name: 'GameStatus',
});
