import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard, CurrentUser } from '../auth/auth.guard.js';
import type { ValidatedUser } from '../users/interfaces/user.interface.js';
import { CreateRequestData, FulfilRequestData } from './data/index.js';
import { RequestsService } from './requests.service.js';

@ApiTags('Budget requests')
@Controller('budget/requests')
@ApiBearerAuth()
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get('mine')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Crumbs the user can withdraw and their own requests',
  })
  mine(@CurrentUser() user: ValidatedUser) {
    return this.requestsService.mine(user);
  }

  @Post('preview')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'What a request would be paid, without saving it' })
  preview(
    @Body({ schema: CreateRequestData }) data: CreateRequestData,
    @CurrentUser() user: ValidatedUser,
  ) {
    return this.requestsService.preview(user, data);
  }

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Ask for crumbs to be paid out' })
  create(
    @Body({ schema: CreateRequestData }) data: CreateRequestData,
    @CurrentUser() user: ValidatedUser,
  ) {
    return this.requestsService.create(user, data);
  }

  @Post(':id/cancel')
  @UseGuards(AuthGuard)
  cancel(@Param('id') id: string, @CurrentUser() user: ValidatedUser) {
    return this.requestsService.cancel(user, id);
  }

  @Get()
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOperation({ summary: 'The queue of requests, newest first' })
  queue() {
    return this.requestsService.queue();
  }

  @Post(':id/fulfil')
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Pay a request out, which fixes its sums' })
  fulfil(
    @Param('id') id: string,
    @Body({ schema: FulfilRequestData }) data: FulfilRequestData,
    @CurrentUser() user: ValidatedUser,
  ) {
    return this.requestsService.fulfil(id, data, user.username);
  }

  @Post(':id/reject')
  @UseGuards(AuthGuard, AdminGuard)
  reject(@Param('id') id: string, @CurrentUser() user: ValidatedUser) {
    return this.requestsService.reject(id, user.username);
  }
}
