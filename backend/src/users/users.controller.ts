import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUser } from '@auth/auth.guard';
import { ValidatedUser } from './interfaces/user.interface';
import { UsersService } from './users.service';
import { UpdateUserData } from './data/update-user.data';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() validatedUser: ValidatedUser) {
    return this.userService.getCurrentUser(validatedUser.username);
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
