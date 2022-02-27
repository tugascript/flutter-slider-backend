import { ParseIntPipe } from '@nestjs/common';
import {
  Args,
  Context,
  Int,
  Mutation,
  Resolver,
  Subscription,
} from '@nestjs/graphql';
import { MercuriusContext, PubSub } from 'mercurius';
import { contextToUser } from 'src/common/helpers/context-to-user';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CommonService } from '../common/common.service';
import { EntityIdDto } from '../common/dtos/entity-id.dto';
import { NotificationTypeEnum } from '../common/enums/notification-type.enum';
import { LocalMessageType } from '../common/gql-types/message.type';
import { INotification } from '../common/interfaces/notification.interface';
import { GameEntity } from './entities/game.entity';
import { GameNotificationType } from './gql-types/game-notification.type';
import { HeadtoheadService } from './headtohead.service';
import { GameInput } from './inputs/game.input';

export const GAME_NOTIFICATION = 'gameNotification';

@Resolver(() => GameEntity)
export class HeadtoheadResolver {
  constructor(
    private readonly h2hService: HeadtoheadService,
    private readonly commonService: CommonService,
  ) {}

  @Mutation(() => GameEntity)
  public async newGame(
    @Context('pubsub') pubsub: PubSub,
    @CurrentUser() userId: number,
    @Args('input') input: GameInput,
  ): Promise<GameEntity> {
    const game = await this.h2hService.createGame(userId, input);
    this.publishNotification(pubsub, game, NotificationTypeEnum.NEW);
    return game;
  }

  @Mutation(() => LocalMessageType)
  public async deleteGame(
    @Context('pubsub') pubsub: PubSub,
    @CurrentUser() userId: number,
    @Args() dto: EntityIdDto,
  ): Promise<LocalMessageType> {
    const game = await this.h2hService.deleteGame(userId, dto.entityId);
    this.publishNotification(pubsub, game, NotificationTypeEnum.DELETE);
    return new LocalMessageType('Game server deleted successfully');
  }

  @Subscription(() => GameNotificationType, {
    name: 'gameNotifications',
    filter: (
      payload: { [GAME_NOTIFICATION]: INotification<GameEntity> },
      { gameId }: { gameId?: number },
      context: MercuriusContext,
    ) => {
      if (gameId) {
        const userId = contextToUser(context);
        const game = payload[GAME_NOTIFICATION].edge.node;

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

  private publishNotification(
    pubsub: PubSub,
    game: GameEntity,
    typeEnum: NotificationTypeEnum,
  ) {
    pubsub.publish({
      topic: GAME_NOTIFICATION,
      payload: {
        [GAME_NOTIFICATION]: this.commonService.generateNotification(
          game,
          typeEnum,
          'id',
        ),
      },
    });
  }
}
