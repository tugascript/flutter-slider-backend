import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import {
  BadRequestException,
  CACHE_MANAGER,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { v5 as uuidV5 } from 'uuid';
import { CommonService } from '../common/common.service';
import { FilterDto } from '../common/dtos/filter.dto';
import { QueryOrderEnum } from '../common/enums/query-order.enum';
import { IPaginated } from '../common/interfaces/paginated.interface';
import { UploaderService } from '../uploader/uploader.service';
import { UsersService } from '../users/users.service';
import { SearchGamesDto } from './dtos/search-games.dto';
import { GameEntity } from './entities/game.entity';
import { DifficultyEnum } from './enum/difficulty.enum';
import { GameStatusEnum } from './enum/game-status.enum';
import { PieceType } from './gql-types/piece.type';
import { PositionType } from './gql-types/position.type';
import { PuzzleType } from './gql-types/puzzle.type';
import { EndGameInput } from './inputs/end-game.input';
import { GameInput } from './inputs/game.input';
import { PositionInput } from './inputs/position.input';
import { IGameState } from './interfaces/game-state.interface';
import { IMovePiece } from './interfaces/move-piece.interface';
import { randomNumber } from './utils/random-number.util';

@Injectable()
export class HeadtoheadService {
  constructor(
    @InjectRepository(GameEntity)
    private readonly gamesRepository: EntityRepository<GameEntity>,
    private readonly uploaderService: UploaderService,
    private readonly usersService: UsersService,
    private readonly commonService: CommonService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  private readonly gameNamespace = this.configService.get<string>('GAME_UUID');
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
   * End game
   *
   * Sets the winner of the game and sets the status to done.
   */
  public async endGame(
    userId: number,
    { gameId, time, winner }: EndGameInput,
  ): Promise<GameEntity> {
    const game = await this.gamesRepository.findOne({
      id: gameId,
      status: GameStatusEnum.on,
    });
    this.commonService.checkExistence('Game', game);

    if (game.challenger?.id !== userId && game.host.id !== userId)
      throw new BadRequestException("You are't participating in this game");

    game.time = time;
    game.winner = winner;
    game.status = GameStatusEnum.done;
    await this.commonService.throwInternalError(this.gamesRepository.flush());

    return game;
  }

  //_________________________ QUERIES _________________________

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

  //_________________________ PUZZLE LOGIC _________________________

  /**
   * New Puzzle
   *
   * Generates a new puzzle, suffles it and saves it to cache
   */
  public async newPuzzle(userId: number, gameId: number): Promise<IGameState> {
    const game = await this.gamesRepository.findOne({
      id: gameId,
      host: userId,
      status: GameStatusEnum.new,
    });
    this.commonService.checkExistence('Game', game);

    if (!game.challenger)
      throw new BadRequestException('This game has no challenger');

    // Generates the base Puzzle
    const len = game.level + 2;
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
    let next = new PositionType(index, index);

    // shuffle puzzle
    const shuffles = len * len;

    for (let i = 0; i < shuffles; i++) {
      const nextRow = next.row;
      const nextColumn = next.column;

      if (i % 2 === 0) {
        let row = randomNumber(len);

        while (row === nextRow) {
          row = randomNumber(len);
        }

        this.changeRow(puzzle, row, nextColumn, nextRow);
        next = new PositionType(row, nextColumn);
      } else {
        let column = randomNumber(len);

        while (column === nextColumn) {
          column = randomNumber(len);
        }

        this.changeColumn(puzzle, nextRow, column, nextColumn);
        next = new PositionType(nextRow, column);
      }
    }

    // Saving it to cache
    const puzzleType = new PuzzleType({
      puzzle,
      next,
      time: this.getTime(game.difficulty, game.level),
    });
    const hostId = uuidV5(`${gameId}-${game.host.id}`, this.gameNamespace);
    const challengerId = uuidV5(
      `${gameId}-${game.challenger.id}`,
      this.gameNamespace,
    );
    await this.cachePuzzle(hostId, puzzleType);
    await this.cachePuzzle(challengerId, puzzleType);

    // Updating game status
    game.status = GameStatusEnum.on;
    await this.commonService.throwInternalError(this.gamesRepository.flush());

    return { hostId, challengerId, puzzle: puzzleType };
  }

  /**
   * Move Piece
   *
   * Takes a position and checks it against current puzzle saved
   * in cache.
   */
  public async movePiece(
    userId: number,
    { gameId, row, column }: PositionInput,
  ): Promise<IMovePiece> {
    const cacheId = uuidV5(`${gameId}-${userId}`, this.gameNamespace);
    const puzzleType = await this.commonService.throwInternalError(
      this.cacheManager.get<PuzzleType>(cacheId),
    );

    if (!puzzleType) throw new NotFoundException('Puzzle not found');

    const puzzle = puzzleType.puzzle;
    const len = puzzle.length;
    let next = puzzleType.next;
    let completed = false;
    const nextRow = next.row;
    const nextColumn = next.column;

    if (
      row < len &&
      column < len &&
      (nextRow === row || nextColumn === column) &&
      (nextRow !== row || nextColumn !== column)
    ) {
      if (row === nextRow && column !== nextColumn) {
        this.changeColumn(puzzle, row, column, nextColumn);
      } else if (row !== nextRow && column === nextColumn) {
        this.changeRow(puzzle, row, column, nextRow);
      }

      next = new PositionType(row, column);
      completed = this.checkIfComplete(puzzle, len);
    }

    puzzleType.puzzle = puzzle;
    puzzleType.next = next;
    puzzleType.completed = completed;
    await this.cachePuzzle(cacheId, puzzleType);

    return { userUuid: cacheId, puzzle: puzzleType };
  }

  //_________________________ PRIVATE METHODS _________________________

  private changeRow(
    puzzle: PieceType[][],
    row: number,
    column: number,
    nextRow: number,
  ): void {
    if (row < nextRow) {
      for (let i = nextRow; i > row; i--) {
        const j = i - 1;
        const currOne = puzzle[i][column];
        const prevOne = puzzle[j][column];
        puzzle[i][column] = prevOne;
        puzzle[j][column] = currOne;
      }
    } else {
      for (let i = nextRow; i < row; i++) {
        const j = i + 1;
        const currOne = puzzle[i][column];
        const nextOne = puzzle[j][column];
        puzzle[i][column] = nextOne;
        puzzle[j][column] = currOne;
      }
    }
  }

  private checkIfComplete(puzzle: PieceType[][], len: number): boolean {
    for (let i = 0; i < len; i++) {
      for (let j = 0; j < len; j++) {
        const pos = puzzle[i][j].position;

        if (pos.row !== i || pos.column !== j) return false;
      }
    }

    return true;
  }

  private changeColumn(
    puzzle: PieceType[][],
    row: number,
    column: number,
    nextColumn: number,
  ) {
    if (column < nextColumn) {
      for (let i = nextColumn; i > column; i--) {
        const j = i - 1;
        const currOne = puzzle[row][i];
        const prevOne = puzzle[row][j];
        puzzle[row][i] = prevOne;
        puzzle[row][j] = currOne;
      }
    } else {
      for (let i = nextColumn; i < column; i++) {
        const j = i + 1;
        const currOne = puzzle[row][i];
        const nextOne = puzzle[row][j];
        puzzle[row][i] = nextOne;
        puzzle[row][j] = currOne;
      }
    }
  }

  private getTime(difficulty: DifficultyEnum, level: number) {
    let seconds = 0;

    switch (difficulty) {
      case DifficultyEnum.hard:
        seconds = 150;
        break;
      case DifficultyEnum.medium:
        seconds = 300;
        break;
      case DifficultyEnum.easy:
        seconds = 600;
        break;
    }

    return seconds * (level + 1);
  }

  private async cachePuzzle(uuid: string, puzzle: PuzzleType): Promise<void> {
    await this.commonService.throwInternalError(
      this.cacheManager.set(uuid, puzzle, {
        ttl: puzzle.time,
      }),
    );
  }
}
