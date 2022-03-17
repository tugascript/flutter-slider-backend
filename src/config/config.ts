import { LoadStrategy } from '@mikro-orm/core';
import { IConfig } from './interfaces/config.interface';

export const config = (): IConfig => ({
  port: parseInt(process.env.PORT, 10),
  url: process.env.URL,
  jwt: {
    access: {
      secret: process.env.JWT_ACCESS_SECRET,
      time: parseInt(process.env.JWT_ACCESS_TIME, 10),
    },
    refresh: {
      secret: process.env.JWT_REFRESH_SECRET,
      time: parseInt(process.env.JWT_REFRESH_TIME, 10),
    },
  },
  emailService: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: Boolean(process.env.EMAIL_SECURE),
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  },
  bucketConfig: {
    forcePathStyle: false,
    region: process.env.BUCKET_REGION,
    endpoint: `https://${process.env.BUCKET_REGION}.linodeobjects.com`,
    credentials: {
      accessKeyId: process.env.BUCKET_ACCESS_KEY,
      secretAccessKey: process.env.BUCKET_SECRET_KEY,
    },
  },
  db: {
    type: 'postgresql',
    entities: ['dist/**/*.entity.js', 'dist/**/*.embeddable.js'],
    entitiesTs: ['src/**/*.entity.ts', 'src/**/*.embeddable.ts'],
    clientUrl: process.env.DATABASE_URL,
    loadStrategy: LoadStrategy.JOINED,
    allowGlobalContext: true,
  },
  ttl: parseInt(process.env.REDIS_CACHE_TTL, 10),
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10),
    maxFiles: parseInt(process.env.MAX_FILES, 10),
  },
});
