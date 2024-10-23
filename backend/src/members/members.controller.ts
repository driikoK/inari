import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MembersService } from './members.service';
import { CreateMemberData } from './data/create-member.data';
import { MemberFilterData } from './data/filter-members.data';
import { AuthGuard } from '@auth/auth.guard';
import { UpdateMemberData } from './data/update-member.data';

@ApiTags('Members')
@Controller('members')
@ApiBearerAuth()
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  @UseGuards(AuthGuard)
  async getMembers(@Query() filter: MemberFilterData) {
    return this.membersService.findAll(filter);
  }

  @Post()
  @UseGuards(AuthGuard)
  async createMember(@Body() member: CreateMemberData) {
    return this.membersService.createMember(member);
  }

  @Put()
  @UseGuards(AuthGuard)
  async updateMember(@Body() member: UpdateMemberData) {
    return this.membersService.updateMember(member);
  }

  @Get('/roles')
  @UseGuards(AuthGuard)
  async getTypes() {
    return this.membersService.getAllRoles();
  }
}
