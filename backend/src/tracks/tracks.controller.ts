import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TrackService } from './tracks.service.js';
import { CreateTrackData } from './data/create-track.data.js';
import { FilterTrackData } from './data/filter-track.data.js';
import { UpdateTrackData } from './data/update-track.data.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard, CurrentUser } from '../auth/auth.guard.js';
import { CuratorGuard } from '../auth/curator.guard.js';
import type { ValidatedUser } from '../users/interfaces/user.interface.js';
import { LastTracksData } from './data/last-tracks.js';

@ApiTags('Tracks')
@Controller('tracks')
@ApiBearerAuth()
export class TracksController {
  constructor(private readonly trackService: TrackService) {}

  @Get()
  @UseGuards(AuthGuard)
  async getAllTracks(
    @Query({ schema: FilterTrackData }) filter: FilterTrackData,
  ) {
    return this.trackService.findAll(filter);
  }

  @Post()
  @UseGuards(AuthGuard, CuratorGuard)
  async addNewTrack(
    @Body({ schema: CreateTrackData }) track: CreateTrackData,
    @CurrentUser() user: ValidatedUser,
  ) {
    return this.trackService.create(track, user.username);
  }

  @Put(':id')
  @UseGuards(AuthGuard, AdminGuard)
  updateTrack(
    @Param('id') id: string,
    @Body({ schema: UpdateTrackData }) track: UpdateTrackData,
    @CurrentUser() user: ValidatedUser,
  ) {
    return this.trackService.update(id, track, user.username);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, AdminGuard)
  async deleteTrack(
    @Param('id') id: string,
    @CurrentUser() user: ValidatedUser,
  ) {
    return this.trackService.delete(id, user.username);
  }

  @Get('last')
  @UseGuards(AuthGuard)
  async getLastTracksForTitle(
    @Query({ schema: LastTracksData }) data: LastTracksData,
  ) {
    return this.trackService.getLastTracks(data);
  }
}
