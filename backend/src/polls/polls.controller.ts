import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard, CurrentUser } from '@auth/auth.guard';
import { ValidatedUser } from '@users/interfaces/user.interface';
import { CreateAnimeData, VoteData } from './data';
import { PollsService } from './polls.service';
import { PollAnimeWithoutVotes, Result } from './interfaces';

@ApiTags('Polls')
@Controller('polls')
@ApiBearerAuth()
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  @Get('/animes')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get all animes for voting' })
  @ApiResponse({ status: 200, description: 'Success' })
  async getAllAnimes(): Promise<{
    ongoings: PollAnimeWithoutVotes[];
    olds: PollAnimeWithoutVotes[];
  }> {
    return this.pollsService.findAll();
  }

  // TODO: fix examples in swagger
  @Post('/add-anime')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Add anime for voting' })
  async createAnime(@Body() anime: CreateAnimeData): Promise<CreateAnimeData> {
    return this.pollsService.createAnime(anime);
  }

  // TODO: fix examples in swagger
  @Post('/vote')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Vote for an anime' })
  @ApiBody({ type: VoteData })
  async vote(
    @CurrentUser() user: ValidatedUser,
    @Body() voteData: VoteData,
  ): Promise<boolean> {
    await this.pollsService.vote(user.username, voteData.animeIds);
    return true;
  }

  @Post('/clear-poll')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Clear results' })
  async clearPolls(): Promise<boolean> {
    await this.pollsService.clearAllAnimesAndVotes();
    return true;
  }

  @Get('/result')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get voting results' })
  async findResult(): Promise<Result[]> {
    return this.pollsService.getVoteResult();
  }

  @Delete('/animes/:id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Delete poll anime' })
  async deleteTeamAnime(@Param('id') id: string): Promise<boolean> {
    return this.pollsService.deleteTeamAnime(id);
  }
}
