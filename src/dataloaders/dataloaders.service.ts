import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { CommonService } from '../common/common.service';
import { QueryOrderEnum } from '../common/enums/query-order.enum';
import { IPaginated } from '../common/interfaces/paginated.interface';
import { RecordEntity } from '../records/entities/record.entity';
import {
  RECORD_ALIAS,
  RECORD_COUNT_ALIAS,
  RECORD_MAIN_COLUMN,
} from '../records/utilities/records.constants';
import { UserEntity } from '../users/entities/user.entity';
import { USER_ALIAS } from '../users/utilities/users.contants';
import { IRecordOwnerQuery } from './interfaces/record-owner-query.interface';
import { IUserMaxLevelQuery } from './interfaces/user-max-level-query.interface';
import { IUserMaxLevelRaw } from './interfaces/user-max-level-raw.interface';
import { IUsersRecordsQuery } from './interfaces/users-records-query.interface';

@Injectable()
export class DataloadersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: EntityRepository<UserEntity>,
    @InjectRepository(RecordEntity)
    private readonly recordsRepository: EntityRepository<RecordEntity>,
    private readonly commonService: CommonService,
  ) {}

  public userRecordsLoader() {
    return async (
      queries: IUsersRecordsQuery[],
    ): Promise<IPaginated<RecordEntity>[]> => {
      const knex = this.recordsRepository.getKnex();
      const { level, first, order } = queries[0].params;
      const orderCode = order === QueryOrderEnum.ASC ? 'asc' : 'desc';
      const userId = `${USER_ALIAS}.id`;
      const recordId = `${RECORD_ALIAS}.id`;
      const userRef = knex.ref(userId);
      const recordsMap = new Map<number, IPaginated<RecordEntity>>();
      const ids: number[] = [];
      const results: IPaginated<RecordEntity>[] = [];

      for (let i = 0; i < queries.length; i++) {
        ids.push(queries[i].obj.id);
      }

      const recordsQuery = this.recordsRepository
        .createQueryBuilder(RECORD_ALIAS)
        .select([recordId, `${RECORD_ALIAS}.${RECORD_MAIN_COLUMN}`])
        .where({ owner: userRef, level })
        .getKnexQuery();

      const knexQb = knex
        .queryBuilder()
        .select('id')
        .from(recordsQuery)
        .orderBy(RECORD_MAIN_COLUMN, orderCode)
        .limit(first);

      const recordsCountQuery = this.recordsRepository
        .createQueryBuilder(RECORD_COUNT_ALIAS)
        .where({ owner: userRef, level })
        .count(`${RECORD_COUNT_ALIAS}.id`, true)
        .as('records_count');

      const raw: any[] = await this.commonService.throwInternalError(
        this.usersRepository
          .createQueryBuilder(USER_ALIAS)
          .select([userId, recordsCountQuery])
          .leftJoinAndSelect(`${USER_ALIAS}.records`, RECORD_ALIAS)
          .groupBy([userId, recordId])
          .where({
            id: {
              $in: ids,
            },
            records: {
              id: {
                $in: knexQb,
              },
            },
          })
          .execute(),
      );

      for (let i = 0; i < raw.length; i++) {
        const { records, records_count, id } = raw[i];
        const normalRecords: RecordEntity[] = [];

        for (let j = 0; j < records.length; j++) {
          const record = this.recordsRepository.map(records[j]);
          normalRecords.push(record);
        }

        const paginatedRecords = this.commonService.paginate(
          normalRecords,
          records_count,
          'performance',
          first,
        );
        recordsMap.set(id, paginatedRecords);
      }

      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        const record = recordsMap.get(id) ?? {
          totalCount: 0,
          edges: [],
          pageInfo: {
            endCursor: '',
            hasNextPage: false,
          },
        };
        results.push(record);
      }

      return results;
    };
  }

  public recordOwnerLoader() {
    return async (queries: IRecordOwnerQuery[]): Promise<UserEntity[]> => {
      const ids: number[] = [];

      for (let i = 0; i < queries.length; i++) {
        const record = queries[i].obj;
        ids.push(record.owner.id);
      }

      const users = await this.usersRepository.find({
        id: {
          $in: ids,
        },
      });
      const usersMap = new Map<number, UserEntity>();

      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        usersMap.set(user.id, user);
      }

      const result: UserEntity[] = [];

      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        result.push(usersMap.get(id));
      }

      return result;
    };
  }

  public userMaxLevelLoader() {
    return async (queries: IUserMaxLevelQuery[]): Promise<number[]> => {
      const ids: number[] = [];
      const levelMap = new Map<number, number>();
      const userId = `${USER_ALIAS}.id`;
      const recordId = `${RECORD_ALIAS}.id`;
      const knex = this.recordsRepository.getKnex();

      for (let i = 0; i < queries.length; i++) {
        const userId = queries[i].obj.id;
        ids.push(userId);
      }

      const recordsQuery = this.recordsRepository
        .createQueryBuilder(RECORD_ALIAS)
        .select([recordId])
        .where({ owner: knex.ref(userId) })
        .orderBy({ level: QueryOrderEnum.DESC })
        .limit(1)
        .getKnexQuery();

      const raw: IUserMaxLevelRaw[] =
        await this.commonService.throwInternalError(
          this.usersRepository
            .createQueryBuilder(USER_ALIAS)
            .select([userId, `${RECORD_ALIAS}.level`])
            .leftJoin('u.records', RECORD_ALIAS)
            .where({
              id: {
                $in: ids,
              },
              records: {
                id: {
                  $in: recordsQuery,
                },
              },
            })
            .execute(),
        );

      for (let i = 0; i < raw.length; i++) {
        const { id, level } = raw[i];
        levelMap.set(id, level);
      }

      const result: number[] = [];

      for (let i = 0; i < ids.length; i++) {
        const level = levelMap.get(ids[i]);
        result.push(level ?? 0);
      }

      return result;
    };
  }
}
