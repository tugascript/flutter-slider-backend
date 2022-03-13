import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlOptionsFactory } from '@nestjs/graphql';
import altair from 'altair-fastify-plugin';
import Redis, { RedisOptions } from 'ioredis';
import mercuriusCache, { MercuriusCacheOptions } from 'mercurius-cache';
import { DataloadersService } from '../dataloaders/dataloaders.service';
import { MercuriusDriverPlugin } from './interfaces/mercurius-driver-plugin.interface';
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
            loader: this.dataloadersService.recordOwnerLoader(),
            opts: { cache: true },
          },
        },
        User: {
          records: {
            loader: this.dataloadersService.userRecordsLoader(),
            opts: { cache: true },
          },
        },
      },
    };
  }
}
