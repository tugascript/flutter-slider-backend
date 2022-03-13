import { S3ClientConfig } from '@aws-sdk/client-s3';
import { MikroOrmModuleOptions } from '@mikro-orm/nestjs';
import { UploadOptions } from 'graphql-upload';
import { RedisOptions } from 'ioredis';
import { IEmailConfig } from './email-config.interface';
import { IJwt } from './jwt.interface';

export type tLikeOperator = '$ilike' | '$like';

export interface IConfig {
  port: number;
  url: string;
  db: MikroOrmModuleOptions;
  jwt: IJwt;
  emailService: IEmailConfig;
  bucketConfig: S3ClientConfig;
  redis: RedisOptions | null;
  ttl: number;
  upload: UploadOptions;
  testing: boolean;
  likeOperator: tLikeOperator;
}
