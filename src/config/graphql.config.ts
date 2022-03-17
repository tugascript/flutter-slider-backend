import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlOptionsFactory } from '@nestjs/graphql';
import Redis, { RedisOptions } from 'ioredis';
import mercuriusCache, { MercuriusCacheOptions } from 'mercurius-cache';
import { DataloadersService } from '../dataloaders/dataloaders.service';
import { MercuriusExtendedDriverConfig } from './interfaces/mercurius-extended-driver-config.interface';

@Injectable()
export class GqlConfigService implements GqlOptionsFactory {
  constructor(
    private readonly configService: ConfigService,
    private readonly dataloadersService: DataloadersService,
  ) {}

  private readonly testing = this.configService.get<boolean>('testing');
  private readonly redisOpt = this.configService.get<RedisOptions>('redis');

  public createGqlOptions(): MercuriusExtendedDriverConfig {
    return {
      graphiql: false,
      ide: false,
      path: '/api/graphql',
      routes: true,
      plugins: [
        {
          plugin: mercuriusCache,
          options: {
            ttl: 5,
            all: true,
            storage: {
              type: 'redis',
              options: {
                client: new Redis(this.redisOpt),
                invalidation: { referencesTTL: 60, invalidate: true },
              },
            },
          } as MercuriusCacheOptions,
        },
      ],
      autoSchemaFile: './schema.gql',
      loaders: {
        Record: {
          owner: {
            loader: this.dataloadersService.recordOwnerLoader(),
            opts: { cache: true },
          },
        },
        User: {
          records: {
            loader: this.dataloadersService.userRecordsLoader(),
            opts: { cache: true },
          },
          maxLevel: {
            loader: this.dataloadersService.userMaxLevelLoader(),
            opts: { cache: true },
          },
        },
      },
    };
  }
}
