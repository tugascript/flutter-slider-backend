import {
  CacheModuleOptions,
  CacheOptionsFactory,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import redisStore from 'cache-manager-ioredis';
import Redis, { RedisOptions } from 'ioredis';

@Injectable()
export class CacheConfig implements CacheOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createCacheOptions(): CacheModuleOptions {
    const ttl = this.configService.get<number>('ttl');

    return {
      ttl,
      store: redisStore,
      redisInstance: new Redis(this.configService.get<RedisOptions>('redis')),
    };
  }
}
