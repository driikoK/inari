import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard, CurrentUser } from '../auth/auth.guard.js';
import { PollsService } from '../polls/polls.service.js';
import { ProposalsService } from '../proposals/proposals.service.js';
import { ROLE } from './enums/index.js';
import type { ValidatedUser } from './interfaces/user.interface.js';
import { UsersService } from './users.service.js';
import { UpdateUserData } from './data/update-user.data.js';
import { UpdateUserNicknameData } from './data/update-user-nickname.data.js';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly userService: UsersService,
    private readonly pollsService: PollsService,
    private readonly proposalsService: ProposalsService,
  ) {}

  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() validatedUser: ValidatedUser) {
    return this.userService.findOneByUsername(validatedUser.username);
  }

  @Get()
  @UseGuards(AuthGuard)
  allUsers() {
    return this.userService.findAll();
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  update(
    @Param('id') id: string,
    @Body({ schema: UpdateUserData }) updateUserData: UpdateUserData,
    @CurrentUser() currentUser: ValidatedUser,
  ) {
    const isAdmin = currentUser.role === ROLE.ADMIN;
    const isSelf = String(currentUser._id) === id;
    const changesRole =
      !!updateUserData.role && updateUserData.role !== currentUser.role;

    if (!isAdmin && (!isSelf || changesRole)) {
      throw new ForbiddenException('Недостатньо прав');
    }

    return this.userService.update(id, updateUserData);
  }

  @Put(':id/nickname')
  @UseGuards(AuthGuard, AdminGuard)
  setNickname(
    @Param('id') id: string,
    @Body({ schema: UpdateUserNicknameData }) data: UpdateUserNicknameData,
    @CurrentUser() currentUser: ValidatedUser,
  ) {
    return this.userService.setNickname(id, data, currentUser.username);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, AdminGuard)
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: ValidatedUser,
  ): Promise<boolean> {
    const username = await this.userService.delete(id, currentUser._id);

    const cleanups = await Promise.allSettled([
      this.pollsService.deleteVotesByUser(username),
      this.proposalsService.deleteParticipationsByUser(username),
    ]);
    const failed = cleanups.find(
      (cleanup): cleanup is PromiseRejectedResult =>
        cleanup.status === 'rejected',
    );

    if (failed) throw failed.reason;

    return true;
  }
}
