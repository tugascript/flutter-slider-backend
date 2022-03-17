import { LoadStrategy, Options } from '@mikro-orm/core';

const config: Options = {
  type: 'postgresql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  entities: ['dist/**/*.entity.js', 'dist/**/*.embeddable.js'],
  entitiesTs: ['src/**/*.entity.ts', 'src/**/*.embeddable.ts'],
  password: process.env.DB_PASSWORD,
  user: process.env.DB_USERNAME,
  dbName: process.env.DB_DATABASE,
  loadStrategy: LoadStrategy.JOINED,
  allowGlobalContext: true,
};

export default config;
