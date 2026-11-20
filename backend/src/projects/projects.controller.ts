import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { AuthGuard } from '../auth/auth.guard.js';
import { CuratorGuard } from '../auth/curator.guard.js';
import { readUpload } from '../posters/upload.js';
import {
  CreateProjectData,
  FinishProjectData,
  UpdateProjectData,
} from './data/index.js';
import { ProjectsService } from './projects.service.js';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @UseGuards(AuthGuard)
  findAll() {
    return this.projectsService.findAll();
  }

  @Get('titles')
  @UseGuards(AuthGuard)
  titles() {
    return this.projectsService.titles();
  }

  @Post()
  @UseGuards(AuthGuard, CuratorGuard)
  create(@Body({ schema: CreateProjectData }) project: CreateProjectData) {
    return this.projectsService.create(project);
  }

  @Put(':id')
  @UseGuards(AuthGuard, CuratorGuard)
  update(
    @Param('id') id: string,
    @Body({ schema: UpdateProjectData }) project: UpdateProjectData,
  ) {
    return this.projectsService.update(id, project);
  }

  @Post(':id/finish')
  @UseGuards(AuthGuard, CuratorGuard)
  finish(
    @Param('id') id: string,
    @Body({ schema: FinishProjectData }) finish: FinishProjectData,
  ) {
    return this.projectsService.finish(id, finish);
  }

  @Post(':id/reopen')
  @UseGuards(AuthGuard, CuratorGuard)
  reopen(@Param('id') id: string) {
    return this.projectsService.reopen(id);
  }

  @Put(':id/poster')
  @UseGuards(AuthGuard, CuratorGuard)
  async setPoster(@Param('id') id: string, @Req() request: FastifyRequest) {
    return this.projectsService.setPoster(id, await readUpload(request));
  }

  @Delete(':id/poster')
  @UseGuards(AuthGuard, CuratorGuard)
  removePoster(@Param('id') id: string) {
    return this.projectsService.removePoster(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, CuratorGuard)
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
