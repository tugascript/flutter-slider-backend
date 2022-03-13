import { faker } from '@faker-js/faker';
import { getRepositoryToken, MikroOrmModule } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/sqlite';
import { CacheModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { CommonModule } from '../../common/common.module';
import { CommonService } from '../../common/common.service';
import { config } from '../../config/config';
import { MikroOrmConfig } from '../../config/mikroorm.config';
import { validationSchema } from '../../config/validation';
import { RecordEntity } from '../../records/entities/record.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { DataloadersService } from '../dataloaders.service';

describe('RecordsService', () => {
  let dataloadersService: DataloadersService,
    commonService: CommonService,
    usersRepository: EntityRepository<UserEntity>,
    recordsRepository: EntityRepository<RecordEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          validationSchema,
          load: [config],
        }),
        CacheModule.register({
          isGlobal: true,
          ttl: parseInt(process.env.REDIS_CACHE_TTL, 10),
        }),
        MikroOrmModule.forRootAsync({
          imports: [ConfigModule],
          useClass: MikroOrmConfig,
        }),
        MikroOrmModule.forFeature([UserEntity, RecordEntity]),
        CommonModule,
      ],
      providers: [DataloadersService, CommonModule],
    }).compile();

    dataloadersService = module.get<DataloadersService>(DataloadersService);
    commonService = module.get<CommonService>(CommonService);
    usersRepository = module.get<EntityRepository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    recordsRepository = module.get<EntityRepository<RecordEntity>>(
      getRepositoryToken(RecordEntity),
    );
  });

  const ids: number[] = [];
  const randomNum = (min: number, max: number): number =>
    Math.floor(Math.random() * (max - min) + min);
  describe('create random records', () => {
    it('should create 10 users', async () => {
      const users: UserEntity[] = [];

      for (let i = 0; i < 10; i++) {
        users.push(
          usersRepository.create({
            email: faker.internet.email(),
            username: commonService.generatePointSlug(faker.name.findName()),
          }),
        );
      }

      await usersRepository.persistAndFlush(users);

      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        expect(user).toBeInstanceOf(UserEntity);
        ids.push(users[i].id);
      }
    });

    it('should create 1000 records', async () => {
      const records: RecordEntity[] = [];

      for (let i = 0; i < 1000; i++) {
        records.push(
          recordsRepository.create({
            level: randomNum(1, 10),
            moves: randomNum(10, 500),
            time: randomNum(30, 300),
            owner: ids[randomNum(0, 9)],
          }),
        );
      }

      await recordsRepository.persistAndFlush(records);

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        expect(record).toBeInstanceOf(RecordEntity);
      }
    });
  });

  describe('records dataloader', () => {
    it('should return the paginated records', async () => {
      const knex = recordsRepository.getKnex();
      const orderSignal = '>';
      const orderCode = 'asc';
      const mainCol = 'performance';
      const userRef = knex.ref('u.id');

      const recordsQuery = recordsRepository
        .createQueryBuilder('r')
        .select(['r.id', 'r.performance'])
        .where({ owner: userRef, level: 5 })
        .getKnexQuery();

      const knexQb = knex
        .queryBuilder()
        .select('id')
        .from(recordsQuery)
        .orderBy(mainCol, orderCode)
        .limit(10);

      const recordsCountQuery = recordsRepository
        .createQueryBuilder('rc')
        .where({ owner: userRef, level: 5 })
        .count('rc.id', true)
        .as('records_count');

      const raw: any[] = await usersRepository
        .createQueryBuilder('u')
        .select(['u.id', recordsCountQuery])
        .leftJoinAndSelect('u.records', 'r')
        .groupBy(['u.id', 'r.id'])
        .where({
          records: {
            id: {
              $in: knexQb,
            },
          },
        })
        .execute();

      // for (let i = 0; i < raw.length; i++) {
      //   const rawRecords: any[] = raw[i].records;
      //   const records: RecordEntity[] = [];

      //   if (rawRecords && rawRecords.length > 0) {
      //     for (let j = 0; j < rawRecords.length; j++) {
      //       records.push(recordsRepository.map(rawRecords[j]));
      //     }
      //   }

      //   console.log(records);
      // }
      console.log(raw);
    });
  });

  it('should be defined', () => {
    expect(dataloadersService).toBeDefined();
    expect(commonService).toBeDefined();
    expect(usersRepository).toBeDefined();
    expect(recordsRepository).toBeDefined();
  });
});
