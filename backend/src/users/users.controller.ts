import { ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Post, Put, Query } from '@nestjs/common';
import { UserService } from './users.service';
import { CreateUserData } from './data/create-user.data';
import { NicknameFilterData } from './data/filter-nicknames.data';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly usersService: UserService) {}

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

  @Get('/roles')
  async getTypes() {
    return this.usersService.getAllRoles();
  }
}
