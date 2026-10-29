import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MembersService } from './members.service.js';
import { CoinsTotalFilterData } from './data/coins-total.data.js';
import { CreateMemberData } from './data/create-member.data.js';
import { MemberFilterData } from './data/filter-members.data.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard, CurrentUser } from '../auth/auth.guard.js';
import { CuratorGuard } from '../auth/curator.guard.js';
import type { ValidatedUser } from '../users/interfaces/user.interface.js';
import { UpdateMemberData } from './data/update-member.data.js';
import { UpdateMemberKindData } from './data/update-member-kind.data.js';

@ApiTags('Members')
@Controller('members')
@ApiBearerAuth()
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  @UseGuards(AuthGuard)
  async getMembers(
    @Query({ schema: MemberFilterData }) filter: MemberFilterData,
  ) {
    return this.membersService.findAll(filter);
  }

  @Get('coins-total')
  @UseGuards(AuthGuard, AdminGuard)
  async getCoinsTotal(
    @Query({ schema: CoinsTotalFilterData }) filter: CoinsTotalFilterData,
  ) {
    return this.membersService.getCoinsTotal(filter);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getMyCoins(@CurrentUser() user: ValidatedUser) {
    return this.membersService.getCoinsOf(user.nickname);
  }

  @Post()
  @UseGuards(AuthGuard, CuratorGuard)
  async createMember(
    @Body({ schema: CreateMemberData }) member: CreateMemberData,
    @CurrentUser() user: ValidatedUser,
  ) {
    return this.membersService.createMember(member, user.username);
  }

  @Put()
  @UseGuards(AuthGuard, AdminGuard)
  async updateMember(
    @Body({ schema: UpdateMemberData }) member: UpdateMemberData,
    @CurrentUser() user: ValidatedUser,
  ) {
    return this.membersService.updateMember(member, user.username);
  }

  @Patch(':id/kind')
  @UseGuards(AuthGuard, AdminGuard)
  async updateKind(
    @Param('id') id: string,
    @Body({ schema: UpdateMemberKindData }) { kind }: UpdateMemberKindData,
  ) {
    return this.membersService.updateKind(id, kind);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, AdminGuard)
  async deleteMember(@Param('id') id: string): Promise<boolean> {
    return this.membersService.deleteMember(id);
  }

  @Get('/roles')
  @UseGuards(AuthGuard)
  async getTypes() {
    return this.membersService.getAllRoles();
  }
}
