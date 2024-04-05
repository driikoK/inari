import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { UserService } from './users.service';
import { CreateUserData } from './data/create-user.data';
import { TypesEnum } from './enums/types.enum';
import { TrackService } from './track.service';
import { CreateTrackData } from './data/create-track.data';
import { ApiBody } from '@nestjs/swagger';

@Controller()
export class UserController {
  constructor(
    private readonly usersService: UserService,
    private readonly trackService: TrackService,
  ) {}

  @Get('/users')
  async getUsers() {
    return this.usersService.findAll();
  }

  @Post('/users')
  async createUser(@Body() user: CreateUserData) {
    return this.usersService.createUser(user);
  }

  @Put('/users')
  async updateUser(@Body() user: CreateUserData) {
    return this.usersService.updateUser(user);
  }

  @Post('/tracks')
  @ApiBody({ type: [CreateTrackData] })
  async addNewTrack(@Body() tracks: CreateTrackData[]) {
    return this.trackService.tracks(tracks);
  }

  @Get('/types')
  async getTypes() {
    return [
      TypesEnum.DIRECTOR,
      TypesEnum.DUB,
      TypesEnum.OTHER,
      TypesEnum.RELEASE,
      TypesEnum.RELEASE,
      TypesEnum.SOUND,
      TypesEnum.SUB,
    ];
  }
}
