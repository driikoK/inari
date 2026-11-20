import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { StandardSchemaValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';

import { AppModule } from './app.module.js';
import type { AppConfig } from './config/configuration.js';
import { MAX_POSTER_BYTES } from './posters/enums/index.js';
import { PostersService } from './posters/posters.service.js';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  const config = app.get<ConfigService<AppConfig, true>>(ConfigService);

  const corsOptions = {
    origin: config.get('app.cors', { infer: true }),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };

  app.enableCors(corsOptions);
  app.useGlobalPipes(new StandardSchemaValidationPipe());

  const posters = app.get(PostersService);

  await posters.ensureDir();
  await app.register(fastifyMultipart, {
    limits: { fileSize: MAX_POSTER_BYTES, files: 1 },
  });
  await app.register(fastifyStatic, {
    root: posters.dir,
    prefix: '/posters/',
    index: false,
    list: false,
    dotfiles: 'deny',
    maxAge: '1y',
    immutable: true,
    setHeaders: (response) =>
      response.header('X-Content-Type-Options', 'nosniff'),
  });

  await app.listen(config.get('app.port', { infer: true }));
}
await bootstrap();
