import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommandModule } from 'nestjs-command';
import { SeedModule } from './seeds/seed.module';
import { UserModule } from './users/users.module';
import { PollsModule } from './polls/polls.module';

@Module({
  imports: [CommandModule, SeedModule, UserModule, PollsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
