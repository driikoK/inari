import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard, CurrentUser } from '../auth/auth.guard.js';
import type { ValidatedUser } from '../users/interfaces/user.interface.js';
import {
  CreateRequestData,
  FulfilRequestData,
  QueueQueryData,
} from './data/index.js';
import { RequestsService } from './requests.service.js';

@Controller('budget/requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get('mine')
  @UseGuards(AuthGuard)
  mine(@CurrentUser() user: ValidatedUser) {
    return this.requestsService.mine(user);
  }

  @Post('preview')
  @UseGuards(AuthGuard)
  preview(
    @Body({ schema: CreateRequestData }) data: CreateRequestData,
    @CurrentUser() user: ValidatedUser,
  ) {
    return this.requestsService.preview(user, data);
  }

  @Post()
  @UseGuards(AuthGuard)
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

  @Get('open-count')
  @UseGuards(AuthGuard, AdminGuard)
  openCount() {
    return this.requestsService.openCount();
  }

  @Get()
  @UseGuards(AuthGuard, AdminGuard)
  queue(@Query({ schema: QueueQueryData }) query: QueueQueryData) {
    return this.requestsService.queue(query);
  }

  @Post(':id/fulfil')
  @UseGuards(AuthGuard, AdminGuard)
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
