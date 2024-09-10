import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommandModule } from 'nestjs-command';
import { SeedModule } from './seeds/seed.module';
import { UserModule } from './users/users.module';
import { PollsModule } from './polls/polls.module';
import { LoggerMiddleware } from './middleware/logger.middleware';

@Module({
  imports: [CommandModule, SeedModule, UserModule, PollsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
