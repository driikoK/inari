import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
import { MembersService } from './members.service.js';
import { CreateMemberData } from './data/create-member.data.js';
import { MemberFilterData } from './data/filter-members.data.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { UpdateMemberData } from './data/update-member.data.js';

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

  @Post()
  @UseGuards(AuthGuard)
  async createMember(
    @Body({ schema: CreateMemberData }) member: CreateMemberData,
  ) {
    return this.membersService.createMember(member);
  }

  @Put()
  @UseGuards(AuthGuard)
  async updateMember(
    @Body({ schema: UpdateMemberData }) member: UpdateMemberData,
  ) {
    return this.membersService.updateMember(member);
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
