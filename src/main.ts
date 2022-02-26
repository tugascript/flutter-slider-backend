import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import cookieParser from 'fastify-cookie';
import { UploadOptions } from 'graphql-upload';
import MercuriusGQLUpload from 'mercurius-upload';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  const configService = app.get(ConfigService);
  app.enableCors({
    credentials: true,
    origin: configService.get<string>('url'),
  });
  app.register(cookieParser as any);
  app.register(
    MercuriusGQLUpload as any,
    configService.get<UploadOptions>('upload'),
  );
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(configService.get<number>('port'));
}
bootstrap();
