import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TeamAnimesService } from './team-animes.service';
import { CreateAnimeData } from './data/create-team-anime.data';

@ApiTags('Team animes')
@Controller('team-animes')
export class TeamAnimesController {
  constructor(private readonly teamAnimeService: TeamAnimesService) {}

  @Get()
  async allTeamAnimes() {
    return this.teamAnimeService.getAllTeamAnime();
  }

  @Post()
  async createTeamAnime(@Body() anime: CreateAnimeData) {
    return this.teamAnimeService.createTeamAnime(anime);
  }

  @Delete(':id')
  async deleteTeamAnime(@Param('id') id: string) {
    return this.teamAnimeService.deleteTeamAnime(id);
  }
}
