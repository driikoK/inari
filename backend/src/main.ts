import { StandardSchemaValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { AppModule } from './app.module.js';
import type { AppConfig } from './config/configuration.js';

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

  const options = new DocumentBuilder()
    .setTitle('API Title')
    .setDescription('API description')
    .setVersion('1.0')
    .addServer('http://localhost:8000/', 'Local environment')
    .addServer('http://staging URL/', 'Staging')
    .addServer('http://production URL/', 'Production')
    .addTag('API Tag')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api-docs', app, document);

  app.enableCors(corsOptions);
  app.useGlobalPipes(new StandardSchemaValidationPipe());

  await app.listen(config.get('app.port', { infer: true }));
}
await bootstrap();
