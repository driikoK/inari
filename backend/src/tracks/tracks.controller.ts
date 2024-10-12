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
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { TrackService } from './tracks.service';
import { CreateTrackData } from './data/create-track.data';
import { FilterTrackData } from './data/filter-track.data';
import { UpdateTrackData } from './data/update-track.data';
import { AuthGuard } from '@auth/auth.guard';

@ApiTags('Tracks')
@Controller('tracks')
export class TracksController {
  constructor(private readonly trackService: TrackService) {}

  @UseGuards(AuthGuard)
  @Get()
  async tracks(@Query() filter: FilterTrackData) {
    return this.trackService.getTracks(filter);
  }

  @UseGuards(AuthGuard)
  @Post()
  @ApiBody({ type: CreateTrackData })
  async addNewTrack(@Body() track: CreateTrackData) {
    return this.trackService.createTrack(track);
  }

  @UseGuards(AuthGuard)
  @Put(':id')
  @ApiBody({ type: UpdateTrackData })
  updateTrack(@Param('id') id: string, @Body() track: UpdateTrackData) {
    return this.trackService.updateTrack(id, track);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async deleteTrack(@Param('id') id: string) {
    return this.trackService.deleteTrack(id);
  }

  @UseGuards(AuthGuard)
  @Get('/seasons')
  async tracksSeasons() {
    return this.trackService.getTrackSeasons();
  }
}
