import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { TrackService } from './tracks.service';
import { CreateTrackData } from './data/create-track.data';
import { FilterTrackData } from './data/filter-track.data';
import { UpdateTrackData } from './data/update-track.data';

@ApiTags('Tracks')
@Controller('tracks')
export class TracksController {
  constructor(private readonly trackService: TrackService) {}

  @Get()
  async tracks(@Query() filter: FilterTrackData) {
    return this.trackService.getTracks(filter);
  }

  @Post()
  @ApiBody({ type: CreateTrackData })
  async addNewTrack(@Body() track: CreateTrackData) {
    console.log(track);

    return this.trackService.createTrack(track);
  }

  @Put(':id')
  @ApiBody({ type: UpdateTrackData })
  updateTrack(@Param('id') id: string, @Body() track: UpdateTrackData) {
    return this.trackService.updateTrack(id, track);
  }

  @Delete(':id')
  async deleteTrack(@Param('id') id: string) {
    return this.trackService.deleteTrack(id);
  }

  @Get('/seasons')
  async tracksSeasons() {
    return this.trackService.getTrackSeasons();
  }
}
