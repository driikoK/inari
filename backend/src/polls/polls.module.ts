import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Anime } from './entities/anime.entity';
import { Vote } from './entities/vote.entity';
import { PollsController } from './polls.controller';
import { PollsService } from './polls.service';

@Module({
  imports: [TypeOrmModule.forFeature([Anime, Vote])],
  providers: [PollsService],
  controllers: [PollsController],
})
export class PollsModule {}
