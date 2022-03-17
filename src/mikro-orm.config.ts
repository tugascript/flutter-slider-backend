import { LoadStrategy, Options } from '@mikro-orm/core';

const config: Options = {
  type: 'postgresql',
  entities: ['dist/**/*.entity.js', 'dist/**/*.embeddable.js'],
  entitiesTs: ['src/**/*.entity.ts', 'src/**/*.embeddable.ts'],
  clientUrl: process.env.DATABASE_URL,
  loadStrategy: LoadStrategy.JOINED,
  allowGlobalContext: true,
};

export default config;
