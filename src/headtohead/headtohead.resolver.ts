import { ParseIntPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Args,
  Context,
  Int,
  Mutation,
  Query,
  Resolver,
  Subscription,
} from '@nestjs/graphql';
import { MercuriusContext, PubSub } from 'mercurius';
import { v5 as uuidV5 } from 'uuid';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CommonService } from '../common/common.service';
import { EntityIdDto } from '../common/dtos/entity-id.dto';
import { FilterDto } from '../common/dtos/filter.dto';
import { NotificationTypeEnum } from '../common/enums/notification-type.enum';
import { LocalMessageType } from '../common/gql-types/message.type';
import { contextToUser } from '../common/helpers/context-to-user';
import { IPaginated } from '../common/interfaces/paginated.interface';
import { SearchGamesDto } from './dtos/search-games.dto';
import { GameEntity } from './entities/game.entity';
import { GameNotificationType } from './gql-types/game-notification.type';
import { PaginatedGamesType } from './gql-types/paginated-games.type';
import { PuzzleType } from './gql-types/puzzle.type';
import { HeadtoheadService } from './headtohead.service';
import { EndGameInput } from './inputs/end-game.input';
import { GameInput } from './inputs/game.input';
import { PositionInput } from './inputs/position.input';
import { IGameNotification } from './interfaces/game-notification.interface';
import { IGameSubVars } from './interfaces/game-sub-vars.interface';
import { IPuzzleChange } from './interfaces/puzzle-change.interface';

export const GAME_NOTIFICATION = 'GAME_NOTIFICATION';

@Resolver(() => GameEntity)
export class HeadtoheadResolver {
  constructor(
    private readonly h2hService: HeadtoheadService,
    private readonly commonService: CommonService,
    private readonly configService: ConfigService,
  ) {}

  private readonly gameNamespace = this.configService.get<string>('GAME_UUID');

  //_________________________ GAME MUTATIONS _________________________

  @Mutation(() => GameEntity)
  public async newGame(
    @Context('pubsub') pubsub: PubSub,
    @CurrentUser() userId: number,
    @Args('input') input: GameInput,
  ): Promise<GameEntity> {
    const game = await this.h2hService.createGame(userId, input);
    this.publishGameNotification(pubsub, game, NotificationTypeEnum.NEW);
    return game;
  }

  @Mutation(() => LocalMessageType)
  public async deleteGame(
    @Context('pubsub') pubsub: PubSub,
    @CurrentUser() userId: number,
    @Args() dto: EntityIdDto,
  ): Promise<LocalMessageType> {
    const game = await this.h2hService.deleteGame(userId, dto.entityId);
    this.publishGameNotification(pubsub, game, NotificationTypeEnum.DELETE);
    return new LocalMessageType('Game server deleted successfully');
  }

  @Mutation(() => GameEntity)
  public async joinGame(
    @Context('pubsub') pubsub: PubSub,
    @CurrentUser() userId: number,
    @Args() dto: EntityIdDto,
  ): Promise<GameEntity> {
    const game = await this.h2hService.joinGame(userId, dto.entityId);
    this.publishGameNotification(pubsub, game, NotificationTypeEnum.UPDATE);
    return game;
  }

  @Mutation(() => GameEntity)
  public async kickChallenger(
    @Context('pubsub') pubsub: PubSub,
    @CurrentUser() userId: number,
    @Args() dto: EntityIdDto,
  ): Promise<GameEntity> {
    const game = await this.h2hService.kickChallenger(userId, dto.entityId);
    this.publishGameNotification(pubsub, game, NotificationTypeEnum.UPDATE);
    return game;
  }

  @Mutation(() => GameEntity)
  public async finishGame(
    @Context('pubsub') pubsub: PubSub,
    @CurrentUser() userId: number,
    @Args('input') input: EndGameInput,
  ): Promise<GameEntity> {
    const game = await this.h2hService.endGame(userId, input);
    this.publishGameNotification(pubsub, game, NotificationTypeEnum.UPDATE);
    return game;
  }

  //_________________________ PUZZLE MUTATIONS _________________________

  @Mutation(() => PuzzleType)
  public async startPuzzle(
    @Context('pubsub') pubsub: PubSub,
    @CurrentUser() userId: number,
    @Args() dto: EntityIdDto,
  ): Promise<PuzzleType> {
    const { hostId, challengerId, puzzle } = await this.h2hService.newPuzzle(
      userId,
      dto.entityId,
    );
    this.publishPuzzleChange(pubsub, puzzle, hostId);
    this.publishPuzzleChange(pubsub, puzzle, challengerId);
    return puzzle;
  }

  @Mutation(() => PuzzleType)
  public async movePiece(
    @Context('pubsub') pubsub: PubSub,
    @CurrentUser() userId: number,
    @Args('input') input: PositionInput,
  ): Promise<PuzzleType> {
    const { userUuid, puzzle } = await this.h2hService.movePiece(userId, input);
    this.publishPuzzleChange(pubsub, puzzle, userUuid);
    return puzzle;
  }

  //_________________________ GAME QUERIES _________________________

  @Query(() => PaginatedGamesType)
  public async getNewGames(
    @Args() dto: SearchGamesDto,
  ): Promise<IPaginated<GameEntity>> {
    return this.h2hService.findNewGames(dto);
  }

  @Query(() => PaginatedGamesType)
  public async getGameRecords(
    @CurrentUser() userId: number,
    @Args() dto: FilterDto,
  ): Promise<IPaginated<GameEntity>> {
    return this.h2hService.getDoneGames(userId, dto);
  }

  //_________________________ SUBSCRIPTIONS _________________________

  @Subscription(() => GameNotificationType, {
    name: 'gameNotifications',
    filter: (
      payload: IGameNotification,
      { gameId }: IGameSubVars,
      context: MercuriusContext,
    ) => {
      if (gameId) {
        const userId = contextToUser(context);
        const game = payload.gameNotification.edge.node;

        return (
          game.id === gameId &&
          (game.challenger?.id === userId || game.host.id === userId)
        );
      }

      return true;
    },
  })
  public async gameNotificationsSubscription(
    @Context('pubsub') pubsub: PubSub,
    @Args(
      {
        name: 'gameId',
        type: () => Int,
        nullable: true,
      },
      ParseIntPipe,
    ) // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _?: number,
  ) {
    return pubsub.subscribe(GAME_NOTIFICATION);
  }

  @Subscription(() => PuzzleType, { name: 'puzzleChange' })
  public async puzzleChangeSubscription(
    @Context('pubsub') pubsub: PubSub,
    @CurrentUser() userId: number,
    @Args() dto: EntityIdDto,
  ) {
    return pubsub.subscribe(
      uuidV5(`${dto.entityId}-${userId}`, this.gameNamespace),
    );
  }

  //_________________________ PUBLISHERS _________________________

  /**
   * Publish Game Notification
   *
   * Subscriptions publisher for game notifications.
   */
  private publishGameNotification(
    pubsub: PubSub,
    game: GameEntity,
    typeEnum: NotificationTypeEnum,
  ) {
    pubsub.publish<IGameNotification>({
      topic: GAME_NOTIFICATION,
      payload: {
        gameNotification: this.commonService.generateNotification(
          game,
          typeEnum,
          'id',
        ),
      },
    });
  }

  /**
   * Publish Puzzle Change
   *
   * Subscriptiuons publisher for puzzle change
   */
  private publishPuzzleChange(
    pubsub: PubSub,
    puzzle: PuzzleType,
    uuid: string,
  ) {
    pubsub.publish<IPuzzleChange>({
      topic: uuid,
      payload: { puzzle },
    });
  }
}
