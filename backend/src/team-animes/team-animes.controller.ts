import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TeamAnimesService } from './team-animes.service.js';
import { CreateTeamAnimeData } from './data/create-team-anime.data.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { ITeamAnime } from './interfaces/team-anime.interface.js';

@ApiTags('Team animes')
@Controller('team-animes')
@ApiBearerAuth()
export class TeamAnimesController {
  constructor(private readonly teamAnimeService: TeamAnimesService) {}

  @Get()
  @UseGuards(AuthGuard)
  async allTeamAnimes(): Promise<ITeamAnime[]> {
    return this.teamAnimeService.findAll();
  }

  @Post()
  @UseGuards(AuthGuard)
  async createTeamAnime(
    @Body({ schema: CreateTeamAnimeData }) anime: CreateTeamAnimeData,
  ) {
    return this.teamAnimeService.create(anime);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteTeamAnime(@Param('id') id: string): Promise<boolean> {
    return this.teamAnimeService.deleteById(id);
  }
}
