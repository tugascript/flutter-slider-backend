import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import {
  BadRequestException,
  CACHE_MANAGER,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { FilterDto } from '../common/dtos/filter.dto';
import { QueryOrderEnum } from '../common/enums/query-order.enum';
import { IPaginated } from '../common/interfaces/paginated.interface';
import { UsersService } from '../users/users.service';
import { CommonService } from '../common/common.service';
import { UploaderService } from '../uploader/uploader.service';
import { SearchGamesDto } from './dtos/search-games.dto';
import { GameEntity } from './entities/game.entity';
import { GameStatusEnum } from './enum/game-status.enum';
import { PuzzleStatusEnum } from './enum/puzzle-status.enum';
import { PieceType } from './gql-types/piece.type';
import { PositionType } from './gql-types/position.type';
import { PuzzleType } from './gql-types/puzzle.type';
import { GameInput } from './inputs/game.input';

@Injectable()
export class HeadtoheadService {
  constructor(
    @InjectRepository(GameEntity)
    private readonly gamesRepository: EntityRepository<GameEntity>,
    private readonly uploaderService: UploaderService,
    private readonly usersService: UsersService,
    private readonly commonService: CommonService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  private readonly name = 'g';

  /**
   * Create Game
   *
   * Game create CRUD operation. Creates a new game server and saves
   * it to the db
   */
  public async createGame(
    userId: number,
    { level, difficulty, image }: GameInput,
  ): Promise<GameEntity> {
    const url = await this.uploaderService.uploadImage(userId, image, 1);
    const game = this.gamesRepository.create({
      level,
      difficulty,
      host: userId,
      image: url,
    });
    await this.commonService.validateEntity(game);
    await this.commonService.throwInternalError(
      this.gamesRepository.persistAndFlush(game),
    );

    return game;
  }

  /**
   * Delete Game
   *
   * Game delete CRUD operation. Finds a new game server without a challenger
   * and deletes it.
   */
  public async deleteGame(userId: number, gameId: number): Promise<GameEntity> {
    const game = await this.getHostGame(userId, gameId);

    if (game.challenger)
      throw new BadRequestException("You can't delete games with challengers");

    await this.commonService.throwInternalError(
      this.gamesRepository.removeAndFlush(game),
    );

    return game;
  }

  /**
   * Join Game
   *
   * Finds a new game server without a challenger and joins it as its
   * challenger.
   */
  public async joinGame(userId: number, gameId: number): Promise<GameEntity> {
    const game = await this.getGameById(gameId);

    if (game.host.id === userId)
      throw new BadRequestException("You can't join your own game server");

    const user = await this.usersService.getUserById(userId);
    game.challenger = user;
    await this.commonService.throwInternalError(this.gamesRepository.flush());

    return game;
  }

  /**
   * Kick Challenger
   *
   * Finds a host's game server and removes the challenger.
   */
  public async kickChallenger(
    userId: number,
    gameId: number,
  ): Promise<GameEntity> {
    const game = await this.getHostGame(userId, gameId);

    if (!game.challenger)
      throw new BadRequestException("This game doesn't have a challenger");

    game.challenger = null;
    await this.commonService.throwInternalError(this.gamesRepository.flush());

    return game;
  }

  /**
   * Get Game by ID
   *
   * Game read CRUD operation. Finds a new game without a challenger by id.
   */
  public async getGameById(gameId: number): Promise<GameEntity> {
    const game = await this.gamesRepository.findOne({
      id: gameId,
      status: GameStatusEnum.new,
      challenger: null,
    });
    this.commonService.checkExistence('Game', game);

    return game;
  }

  /**
   * Find New Games
   *
   * Game read multiple CRUD operation. Finds new games without a challenger and
   * return them cursor paginated.
   */
  public async findNewGames({
    search,
    first,
    after,
  }: SearchGamesDto): Promise<IPaginated<GameEntity>> {
    const qb = this.gamesRepository.createQueryBuilder(this.name).where({
      status: GameStatusEnum.new,
      challenger: null,
    });

    if (search)
      qb.andWhere({
        host: {
          $like: this.commonService.formatSearch(search),
        },
      });

    return await this.commonService.queryBuilderPagination(
      this.name,
      'id',
      first,
      QueryOrderEnum.DESC,
      qb,
      after,
      true,
    );
  }

  /**
   * Get Done Games
   *
   * Get finished games where the current user participated
   */
  public async getDoneGames(
    userId: number,
    { first, after, order }: FilterDto,
  ): Promise<IPaginated<GameEntity>> {
    const qb = this.gamesRepository
      .createQueryBuilder(this.name)
      .where({
        status: GameStatusEnum.done,
      })
      .andWhere({
        $or: [{ challenger: userId }, { host: userId }],
      });

    return await this.commonService.queryBuilderPagination(
      this.name,
      'id',
      first,
      order,
      qb,
      after,
      true,
    );
  }

  /**
   * Get Host Game
   *
   * Finds a new host's game.
   */
  public async getHostGame(
    userId: number,
    gameId: number,
  ): Promise<GameEntity> {
    const game = await this.gamesRepository.findOne({
      id: gameId,
      status: GameStatusEnum.new,
      host: userId,
    });
    this.commonService.checkExistence('Game', game);

    return game;
  }

  public async newPuzzle(
    userId: number,
    { level, difficulty }: GameInput,
  ): Promise<PuzzleType> {
    const len = level + 2;
    const puzzle: PieceType[][] = [];

    for (let i = 0; i < len; i++) {
      const row: PieceType[] = [];

      for (let j = 0; j < len; j++) {
        const pos = new PositionType(i, j);
        row.push(new PieceType(pos));
      }

      puzzle.push(row);
    }

    const index = len - 1;
    puzzle[index][index].empty = true;

    return new PuzzleType({
      puzzle,
      status: PuzzleStatusEnum.starting,
      next: new PositionType(index, index),
    });
  }
}
