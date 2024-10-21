import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { CommandModule } from 'nestjs-command';
import { SeedModule } from './seeds/seed.module';
import { MembersModule } from './members/members.module';
import { PollsModule } from './polls/polls.module';
import { TeamAnimesModule } from './team-animes/team-animes.module';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { TracksModule } from './tracks/tracks.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DictionariesModule } from './dictionaries/dictionaries.module';

@Module({
  imports: [
    CommandModule,
    SeedModule,
    MembersModule,
    PollsModule,
    TeamAnimesModule,
    TracksModule,
    AuthModule,
    UsersModule,
    DictionariesModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
