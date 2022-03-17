import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import cookieParser from 'fastify-cookie';
import cors from 'fastify-cors';
import csrf from 'fastify-csrf';
import { fastifyHelmet } from 'fastify-helmet';
import { UploadOptions } from 'graphql-upload';
import MercuriusGQLUpload from 'mercurius-upload';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  const configService = app.get(ConfigService);
  app.register(cors, {
    credentials: true,
    origin: 'https://slider.tugascript.com',
  });
  app.register(fastifyHelmet);
  app.register(cookieParser, {
    secret: configService.get<string>('COOKIE_SECRET'),
  });
  app.register(csrf);
  app.register(MercuriusGQLUpload, configService.get<UploadOptions>('upload'));
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(configService.get<number>('port'));
}
bootstrap();
