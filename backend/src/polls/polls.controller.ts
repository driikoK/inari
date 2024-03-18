import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { Anime } from './entities/anime.entity';
import { PollsService } from './polls.service';

@Controller()
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  @Get('/ongoings') async getOngoings(): Promise<Anime[]> {
    try {
      const anime = await this.pollsService.findAnimeByIsOngoing(true);
      return anime;
    } catch (error) {
      console.error(error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('/olds') async getOlds(): Promise<Anime[]> {
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
}
