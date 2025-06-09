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
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { TrackService } from './tracks.service';
import { CreateTrackData } from './data/create-track.data';
import { FilterTrackData } from './data/filter-track.data';
import { UpdateTrackData } from './data/update-track.data';
import { AuthGuard } from '@auth/auth.guard';
import { LastTracksData } from './data/last-tracks';

@ApiTags('Tracks')
@Controller('tracks')
@ApiBearerAuth()
export class TracksController {
  constructor(private readonly trackService: TrackService) {}

  @Get()
  @UseGuards(AuthGuard)
  async getAllTracks(@Query() filter: FilterTrackData) {
    return this.trackService.findAll(filter);
  }

  @Post()
  @UseGuards(AuthGuard)
  @ApiBody({ type: CreateTrackData })
  async addNewTrack(@Body() track: CreateTrackData) {
    return this.trackService.create(track);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @ApiBody({ type: UpdateTrackData })
  updateTrack(@Param('id') id: string, @Body() track: UpdateTrackData) {
    return this.trackService.update(id, track);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteTrack(@Param('id') id: string) {
    return this.trackService.delete(id);
  }

  @Get('last')
  @UseGuards(AuthGuard)
  async getLastTracksForTitle(@Query() data: LastTracksData) {
    return this.trackService.getLastTracks(data);
  }
}
