import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration.js';
import { validate } from './config/env.validation.js';
import { SeedModule } from './seeds/seed.module.js';
import { MembersModule } from './members/members.module.js';
import { PollsModule } from './polls/polls.module.js';
import { ProposalsModule } from './proposals/proposals.module.js';
import { TeamAnimesModule } from './team-animes/team-animes.module.js';
import { LoggerMiddleware } from './middleware/logger.middleware.js';
import { TracksModule } from './tracks/tracks.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { DictionariesModule } from './dictionaries/dictionaries.module.js';
import { EmailModule } from './email/email.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], validate }),
    SeedModule,
    MembersModule,
    PollsModule,
    ProposalsModule,
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
