import { Args, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { NewGameDto } from './dtos/new-game.dto';
import { PuzzleType } from './gql-types/puzzle.type';
import { HeadtoheadService } from './headtohead.service';
import { GameInput } from './inputs/game.input';

@Resolver(() => PuzzleType)
export class HeadtoheadResolver {
  constructor(private readonly h2hService: HeadtoheadService) {}

  @Query(() => PuzzleType)
  public newGame(
    @CurrentUser() userId: number,
    @Args('input') input: GameInput,
  ) {
    return this.h2hService.newGame(userId, input);
  }
}
