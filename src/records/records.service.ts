import { QBFilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { CommonService } from '../common/common.service';
import { QueryOrderEnum } from '../common/enums/query-order.enum';
import { IPaginated } from '../common/interfaces/paginated.interface';
import { UsersService } from '../users/users.service';
import { GetRecordsDto } from './dtos/get-records.dto';
import { LevelDto } from './dtos/level.dto';
import { RecordEntity } from './entities/record.entity';
import { RecordInput } from './inputs/record.input';
import {
  RECORD_ALIAS,
  RECORD_MAIN_COLUMN,
} from './utilities/records.constants';

@Injectable()
export class RecordsService {
  constructor(
    @InjectRepository(RecordEntity)
    private readonly recordsRepository: EntityRepository<RecordEntity>,
    private readonly usersService: UsersService,
    private readonly commonService: CommonService,
  ) {}

  /**
   * Create Record
   *
   * Record create CRUD operation. Creates a new record, and if
   * it's a new level saves as the new user max level.
   */
  public async createRecord(
    userId: number,
    input: RecordInput,
  ): Promise<RecordEntity> {
    const record = this.recordsRepository.create({ owner: userId, ...input });
    const count = await this.recordsRepository.count({ level: input.level });

    if (count === 0) {
      const user = await this.usersService.getUserById(userId);
      user.maxLevel = input.level;
    }

    await this.commonService.validateEntity(record);
    await this.commonService.throwInternalError(
      this.recordsRepository.persistAndFlush(record),
    );
    return record;
  }

  /**
   * Get Records
   *
   * Records read multiple CRUD operation. Gets the user's cursor paginated
   * by performance (performance is a row_number select).
   */
  public async getRecords({
    userId,
    level,
    after,
    first,
    order,
  }: GetRecordsDto): Promise<IPaginated<RecordEntity>> {
    return await this.getPaginatedResults(
      { owner: userId, level },
      order,
      first,
      after,
    );
  }

  /**
   * Get High Scores
   *
   * Loads records ordered by performance distinct by level and owner
   */
  public async getHighScores({
    level,
    first,
    after,
  }: LevelDto): Promise<IPaginated<RecordEntity>> {
    return await this.getPaginatedResults(
      { level },
      QueryOrderEnum.ASC,
      first,
      after,
    );
  }

  /**
   * Get Paginated Results
   *
   * Takes the where clause and paginates results with the knex query
   */
  private async getPaginatedResults(
    where: QBFilterQuery<RecordEntity>,
    order: QueryOrderEnum,
    first: number,
    after?: string,
  ): Promise<IPaginated<RecordEntity>> {
    const orderSignal = order === QueryOrderEnum.ASC ? '>' : '<';
    const orderCode = order === QueryOrderEnum.ASC ? 'asc' : 'desc';
    const knex = this.recordsRepository.getKnex();

    const knexQuery = this.recordsRepository
      .createQueryBuilder(RECORD_ALIAS)
      .where(where)
      .getKnexQuery();

    const knexQb = knex
      .queryBuilder()
      .select('*')
      .from(knexQuery)
      .orderBy(RECORD_MAIN_COLUMN, orderCode);

    const knexCountQb = knex
      .queryBuilder()
      .countDistinct(RECORD_MAIN_COLUMN, { as: 'count' })
      .from(knexQuery);

    if (after) {
      const cursor = this.commonService.decodeCursor(after, true);
      knexQb.where(RECORD_MAIN_COLUMN, orderSignal, cursor);
      knexCountQb.where(RECORD_MAIN_COLUMN, orderSignal, cursor);
    }

    const [countResult, raw] = await this.commonService.throwInternalError(
      Promise.all([knexCountQb, knexQb.limit(first)]),
    );
    const records: RecordEntity[] = [];

    for (let i = 0; i < raw.length; i++) {
      records.push(this.recordsRepository.map(raw[i]));
    }

    return this.commonService.paginate(
      records,
      countResult[0].count as number,
      'performance',
      first,
    );
  }
}
