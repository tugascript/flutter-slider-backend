import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlOptionsFactory } from '@nestjs/graphql';
import altair from 'altair-fastify-plugin';
import Redis, { RedisOptions } from 'ioredis';
import mercuriusCache, { MercuriusCacheOptions } from 'mercurius-cache';
import redis from 'mqemitter-redis';
import { AuthService } from '../auth/auth.service';
import { MercuriusExtendedDriverConfig } from './interfaces/mercurius-extended-driver-config.interface';

@Injectable()
export class GqlConfigService implements GqlOptionsFactory {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  private readonly testing = this.configService.get<boolean>('testing');
  private readonly redisOpt = this.configService.get<RedisOptions>('redis');

  public createGqlOptions(): MercuriusExtendedDriverConfig {
    return {
      graphiql: false,
      ide: false,
      path: '/api/graphql',
      routes: true,
      subscription: {
        fullWsTransport: true,
        emitter: this.testing ? undefined : redis(this.redisOpt),
        onConnect: async ({ payload }) => {
          const ctx: Record<string, number> = {};

          const authHeader = payload.authorization;
          if (payload.authorization) {
            const arr = authHeader.split(' ');

            if (arr[0] === 'Bearer') {
              try {
                const { id } = await this.authService.verifyAuthToken(
                  arr[1],
                  'access',
                );
                ctx.user = id;
              } catch (_) {}
            }
          }

          return ctx;
        },
      },
      plugins: [
        {
          plugin: mercuriusCache,
          options: {
            ttl: this.configService.get<number>('ttl'),
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
        {
          plugin: altair,
          options: {
            path: '/altair',
            baseURL: '/altair/',
            endpointURL: '/api/graphql',
          },
        },
      ],
      autoSchemaFile: './schema.gql',
    };
  }
}
