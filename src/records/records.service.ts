import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { CommonService } from '../common/common.service';
import { FilterDto } from '../common/dtos/filter.dto';
import { IPaginated } from '../common/interfaces/paginated.interface';
import { UsersService } from '../users/users.service';
import { RecordEntity } from './entities/record.entity';
import { GetRecordsInput } from './inputs/get-records.input';
import { RecordInput } from './inputs/record.input';

@Injectable()
export class RecordsService {
  constructor(
    @InjectRepository(RecordEntity)
    private readonly recordsRepository: EntityRepository<RecordEntity>,
    private readonly usersService: UsersService,
    private readonly commonService: CommonService,
  ) {}

  private readonly name = 'r';

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
   * records.
   */
  public async getRecords({
    userId,
    level,
    after,
    first,
    order,
  }: GetRecordsInput): Promise<IPaginated<RecordEntity>> {
    const qb = this.recordsRepository
      .createQueryBuilder(this.name)
      .where({ owner: userId });

    if (level) qb.andWhere({ level });

    return await this.commonService.queryBuilderPagination(
      this.name,
      'performance',
      first,
      order,
      qb,
      after,
      true,
    );
  }

  /**
   * Load Records
   *
   * Same as previous method but for resolve fields.
   */
  public async loadRecords(
    userId: number,
    { first, after, order }: FilterDto,
  ): Promise<IPaginated<RecordEntity>> {
    const qb = this.recordsRepository
      .createQueryBuilder(this.name)
      .where({ owner: userId });

    return await this.commonService.queryBuilderPagination(
      this.name,
      'performance',
      first,
      order,
      qb,
      after,
      true,
    );
  }
}
