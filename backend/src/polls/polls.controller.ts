import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { PollsService } from './polls.service';
import { IAnime } from './interfaces/anime.interface';
import { ApiTags } from '@nestjs/swagger';
import { AnimeData } from './data/anime.data';

@ApiTags('Polls')
@Controller('polls')
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  @Get('/ongoings') async getOngoings(): Promise<IAnime[]> {
    try {
      const anime = await this.pollsService.findAnimeByIsOngoing(true);
      return anime;
    } catch (error) {
      console.error(error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('/olds') async getOlds(): Promise<IAnime[]> {
    try {
      const anime = await this.pollsService.findAnimeByIsOngoing(false);
      return anime;
    } catch (error) {
      console.error(error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('/result') async findResult(): Promise<any> {
    try {
      const anime = await this.pollsService.getVoteResult();
      return anime;
    } catch (error) {
      console.error(error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('/vote')
  async vote(
    @Body() body: { userName: string; animeIds: number[] },
  ): Promise<boolean> {
    try {
      await this.pollsService.vote(body.userName, body.animeIds);
      return true;
    } catch (error) {
      console.error(error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('/clear-poll')
  async claerPoll(): Promise<boolean> {
    try {
      await this.pollsService.clearAllAnimesAndVotes();
      return true;
    } catch (error) {
      console.error(error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('/set-anime')
  async setAnime(@Body('animeList') animeList: AnimeData[]): Promise<boolean> {
    try {
      for (const anime of animeList) {
        await this.pollsService.createAnime(anime);
      }
      return true;
    } catch (error) {
      console.error(error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
