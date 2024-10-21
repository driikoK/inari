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
import { TeamAnimesService } from './team-animes.service';
import { CreateAnimeData } from './data/create-team-anime.data';
import { AuthGuard } from '@auth/auth.guard';

@ApiTags('Team animes')
@Controller('team-animes')
@ApiBearerAuth()
export class TeamAnimesController {
  constructor(private readonly teamAnimeService: TeamAnimesService) {}

  @Get()
  @UseGuards(AuthGuard)
  async allTeamAnimes() {
    return this.teamAnimeService.getAllTeamAnime();
  }

  @Post()
  @UseGuards(AuthGuard)
  async createTeamAnime(@Body() anime: CreateAnimeData) {
    return this.teamAnimeService.createTeamAnime(anime);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteTeamAnime(@Param('id') id: string): Promise<boolean> {
    return this.teamAnimeService.deleteTeamAnime(id);
  }
}
