import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CacheModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { AuthModule } from './auth/auth.module';
import { GraphQLAuthGuard } from './auth/guards/gql.guard';
import { CommonModule } from './common/common.module';
import { CacheConfig } from './config/cache.config';
import { config } from './config/config';
import { GqlConfigService } from './config/graphql.config';
import { GraphQLDriver } from './config/graphql.driver';
import { MikroOrmConfig } from './config/mikroorm.config';
import { validationSchema } from './config/validation';
import { EmailModule } from './email/email.module';
import { UploaderModule } from './uploader/uploader.module';
import { UsersModule } from './users/users.module';
import { RecordsModule } from './records/records.module';
import { ImagesModule } from './images/images.module';
import { UserEntity } from './users/entities/user.entity';
import { RecordEntity } from './records/entities/record.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      load: [config],
    }),
    MikroOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: MikroOrmConfig,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useClass: CacheConfig,
    }),
    GraphQLModule.forRootAsync({
      imports: [
        ConfigModule,
        MikroOrmModule.forFeature([UserEntity, RecordEntity]),
      ],
      driver: GraphQLDriver,
      useClass: GqlConfigService,
    }),
    UsersModule,
    CommonModule,
    AuthModule,
    EmailModule,
    UploaderModule,
    RecordsModule,
    ImagesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: GraphQLAuthGuard,
    },
  ],
})
export class AppModule {}
