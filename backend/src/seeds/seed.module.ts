import { Module } from '@nestjs/common';
import { SeedCommand } from './seed.command';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Anime } from 'src/polls/entities/anime.entity';
import { PollsModule } from 'src/polls/polls.module';
import { PollsService } from 'src/polls/polls.service';
import { Vote } from 'src/polls/entities/vote.entity';

@Module({
  imports: [PollsModule, TypeOrmModule.forFeature([Anime, Vote])],
  providers: [SeedCommand, PollsService],
})
export class SeedModule {}
