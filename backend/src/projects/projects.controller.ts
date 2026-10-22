import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard.js';
import { CuratorGuard } from '../auth/curator.guard.js';
import {
  CreateProjectData,
  FinishProjectData,
  UpdateProjectData,
} from './data/index.js';
import { ProjectsService } from './projects.service.js';

@ApiTags('Projects')
@Controller('projects')
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Seasons with the projects on their layout' })
  findAll() {
    return this.projectsService.findAll();
  }

  @Post()
  @UseGuards(AuthGuard, CuratorGuard)
  @ApiOperation({ summary: 'Start a project, optionally from a proposal' })
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

  @Delete(':id')
  @UseGuards(AuthGuard, CuratorGuard)
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
