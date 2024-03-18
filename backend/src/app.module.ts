import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config';
import { PollsModule } from './polls/polls.module';
import { CommandModule } from 'nestjs-command';
import { SeedModule } from './seeds/seed.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: configuration.host,
      port: configuration.port,
      username: configuration.user,
      password: configuration.password,
      database: configuration.db,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      logging: false,
    }),
    PollsModule,
    CommandModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
