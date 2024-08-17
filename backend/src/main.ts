import { AppModule } from './app.module';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import configuration from './config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // const corsOptions: CorsOptions = {
  //   origin: configuration.cors,
  //   methods: ['GET', 'POST', 'PUT', 'DELETE'],
  //   allowedHeaders: ['Content-Type', 'Authorization'],
  // };

  const options = new DocumentBuilder()
    .setTitle('API Title')
    .setDescription('API description')
    .setVersion('1.0')
    .addServer('http://localhost:8000/', 'Local environment')
    .addServer('http://staging URL/', 'Staging')
    .addServer('http://production URL/', 'Production')
    .addTag('API Tag')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(8000);
}
bootstrap();
