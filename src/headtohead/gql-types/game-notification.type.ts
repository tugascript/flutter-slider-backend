import { ObjectType } from '@nestjs/graphql';
import { Notification } from '../../common/gql-types/notification.type';
import { GameEntity } from '../entities/game.entity';

@ObjectType('GameNotification')
export abstract class GameNotificationType extends Notification(GameEntity) {}
