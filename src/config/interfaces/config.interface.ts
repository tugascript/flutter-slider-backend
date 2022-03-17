import { S3ClientConfig } from '@aws-sdk/client-s3';
import { MikroOrmModuleOptions } from '@mikro-orm/nestjs';
import { UploadOptions } from 'graphql-upload';
import { RedisOptions } from 'ioredis';
import { IEmailConfig } from './email-config.interface';
import { IJwt } from './jwt.interface';

export interface IConfig {
  port: number;
  db: MikroOrmModuleOptions;
  jwt: IJwt;
  emailService: IEmailConfig;
  bucketConfig: S3ClientConfig;
  ttl: number;
  upload: UploadOptions;
  redis: RedisOptions;
}
