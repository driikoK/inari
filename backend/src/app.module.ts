import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { SeedModule } from './seeds/seed.module.js';
import { MembersModule } from './members/members.module.js';
import { PollsModule } from './polls/polls.module.js';
import { TeamAnimesModule } from './team-animes/team-animes.module.js';
import { LoggerMiddleware } from './middleware/logger.middleware.js';
import { TracksModule } from './tracks/tracks.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { DictionariesModule } from './dictionaries/dictionaries.module.js';
import { EmailModule } from './email/email.module.js';

@Module({
  imports: [
    SeedModule,
    MembersModule,
    PollsModule,
    TeamAnimesModule,
    TracksModule,
    AuthModule,
    UsersModule,
    DictionariesModule,
    EmailModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: '{*splat}', method: RequestMethod.ALL });
  }
}
