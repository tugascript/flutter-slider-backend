import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlOptionsFactory } from '@nestjs/graphql';
import altair from 'altair-fastify-plugin';
import Redis, { RedisOptions } from 'ioredis';
import mercuriusCache, { MercuriusCacheOptions } from 'mercurius-cache';
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
import { MercuriusDriverPlugin } from './interfaces/mercurius-driver-plugin.interface';
import { MercuriusExtendedDriverConfig } from './interfaces/mercurius-extended-driver-config.interface';
import { IRecordOwnerQuery } from './interfaces/record-owner-query.interface';
import { IUsersRecordsQuery } from './interfaces/users-records-query.interface';

@Injectable()
export class GqlConfigService implements GqlOptionsFactory {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(UserEntity)
    private readonly usersRepository: EntityRepository<UserEntity>,
    @InjectRepository(RecordEntity)
    private readonly recordsRepository: EntityRepository<RecordEntity>,
    private readonly commonService: CommonService,
  ) {}

  private readonly testing = this.configService.get<boolean>('testing');
  private readonly redisOpt = this.configService.get<RedisOptions>('redis');

  public createGqlOptions(): MercuriusExtendedDriverConfig {
    const plugins: MercuriusDriverPlugin<any>[] = [
      {
        plugin: mercuriusCache,
        options: {
          ttl: 5,
          all: true,
          storage: this.testing
            ? undefined
            : {
                type: 'redis',
                options: {
                  client: new Redis(this.redisOpt),
                  invalidation: { referencesTTL: 60, invalidate: true },
                },
              },
        } as MercuriusCacheOptions,
      },
    ];

    if (this.testing) {
      plugins.push({
        plugin: altair,
        options: {
          path: '/altair',
          baseURL: '/altair/',
          endpointURL: '/api/graphql',
        },
      });
    }

    return {
      graphiql: false,
      ide: false,
      path: '/api/graphql',
      routes: true,
      plugins,
      autoSchemaFile: './schema.gql',
      loaders: {
        Record: {
          owner: {
            loader: async (
              queries: IRecordOwnerQuery[],
            ): Promise<UserEntity[]> => {
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
            },
            opts: { cache: true },
          },
        },
        User: {
          records: {
            loader: async (
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
                .select([recordId, `${RECORD_ALIAS}.performance`])
                .where({ owner: userRef, level: level })
                .getKnexQuery();

              const knexQb = knex
                .queryBuilder()
                .select('id')
                .from(recordsQuery)
                .orderBy(RECORD_MAIN_COLUMN, orderCode)
                .limit(10);

              const recordsCountQuery = this.recordsRepository
                .createQueryBuilder(RECORD_COUNT_ALIAS)
                .where({ owner: userRef, level: 5 })
                .count(`${RECORD_COUNT_ALIAS}.id`, true)
                .as('records_count');

              const raw: any[] = await this.usersRepository
                .createQueryBuilder('u')
                .select(['u.id', recordsCountQuery])
                .leftJoinAndSelect('u.records', 'r')
                .groupBy(['u.id', 'r.id'])
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
                .execute();

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
            },
            opts: { cache: true },
          },
        },
      },
    };
  }
}
