import { INotification } from '../../common/interfaces/notification.interface';
import { GameEntity } from '../entities/game.entity';

export interface IGameNotification {
  gameNotification: INotification<GameEntity>;
}
