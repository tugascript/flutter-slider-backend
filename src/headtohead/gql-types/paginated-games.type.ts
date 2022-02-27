import { ObjectType } from '@nestjs/graphql';
import { Paginated } from '../../common/gql-types/paginated.type';
import { GameEntity } from '../entities/game.entity';

@ObjectType('PaginatedGames')
export abstract class PaginatedGamesType extends Paginated(GameEntity) {}
