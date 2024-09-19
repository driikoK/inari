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
import { UserService } from './users.service';
import { CreateUserData } from './data/create-user.data';
import { TrackService } from './tracks.service';
import { CreateTrackData } from './data/create-track.data';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { FilterTrackData } from './data/filter-track.data';
import { UpdateTrackData } from './data/update-track.data';
import { NicknameFilterData } from './data/nicknames-filter.data';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(
    private readonly usersService: UserService,
    private readonly trackService: TrackService,
  ) {}

  @Get()
  async getUsers(@Query() filter: NicknameFilterData) {
    return this.usersService.findAll(filter);
  }

  @Post()
  async createUser(@Body() user: CreateUserData) {
    return this.usersService.createUser(user);
  }

  @Put()
  async updateUser(@Body() user: CreateUserData) {
    return this.usersService.updateUser(user);
  }

  @Post('/tracks')
  @ApiBody({ type: CreateTrackData })
  async addNewTrack(@Body() track: CreateTrackData) {
    return this.trackService.createTrack(track);
  }

  @Put('/track/:id')
  @ApiBody({ type: UpdateTrackData })
  updateTrack(@Param('id') id: string, @Body() track: UpdateTrackData) {
    return this.trackService.updateTrack(id, track);
  }

  @Delete('/track/:id')
  async deleteTrack(@Param('id') id: string) {
    return this.trackService.deleteTrack(id);
  }

  @Get('/tracks')
  async tracks(@Query() filter: FilterTrackData) {
    return this.trackService.getTracks(filter);
  }

  @Get('/tracks/seasons')
  async tracksSeasons() {
    return this.trackService.getTrackSeasons();
  }

  @Get('/roles')
  async getTypes() {
    return this.usersService.getAllRoles();
  }
}
