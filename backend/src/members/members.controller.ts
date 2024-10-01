import { ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Post, Put, Query } from '@nestjs/common';
import { MembersService } from './members.service';
import { CreateMemberData } from './data/create-member.data';
import { NicknameFilterData } from './data/filter-members.data';

@ApiTags('Members')
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  async getMembers(@Query() filter: NicknameFilterData) {
    return this.membersService.findAll(filter);
  }

  @Post()
  async createMember(@Body() member: CreateMemberData) {
    return this.membersService.createMember(member);
  }

  @Put()
  async updateMember(@Body() member: CreateMemberData) {
    return this.membersService.updateMember(member);
  }

  @Get('/roles')
  async getTypes() {
    return this.membersService.getAllRoles();
  }
}
