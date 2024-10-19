import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUser } from '@auth/auth.guard';
import { ValidatedUser } from './interfaces/user.interface';
import { UsersService } from './users.service';
import { UpdateUserData } from './data/update-user.data';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() currentUser: ValidatedUser) {
    return this.userService.getCurrentUser(currentUser.username);
  }

  @Get()
  @UseGuards(AuthGuard)
  allUsers() {
    return this.userService.findAll();
  }

  @Put(':username')
  @UseGuards(AuthGuard)
  update(
    @Param('username') username: string,
    @Body() updateUserData: UpdateUserData,
  ) {
    return this.userService.updateCurrentUser(username, updateUserData);
  }
}
