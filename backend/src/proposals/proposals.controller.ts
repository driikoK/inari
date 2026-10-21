import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard, CurrentUser } from '../auth/auth.guard.js';
import type { ValidatedUser } from '../users/interfaces/user.interface.js';
import {
  CreateProposalData,
  CreateSeasonData,
  ParticipationData,
  SeasonStateData,
  UpdateProposalData,
} from './data/index.js';
import { ProposalsService } from './proposals.service.js';

@ApiTags('Proposals')
@Controller('proposals')
@ApiBearerAuth()
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Seasons with their proposals' })
  findAll() {
    return this.proposalsService.findAll();
  }

  @Post('seasons')
  @UseGuards(AuthGuard, AdminGuard)
  createSeason(@Body({ schema: CreateSeasonData }) season: CreateSeasonData) {
    return this.proposalsService.createSeason(season);
  }

  @Patch('seasons/:id')
  @UseGuards(AuthGuard, AdminGuard)
  setSeasonState(
    @Param('id') id: string,
    @Body({ schema: SeasonStateData }) { isClosed }: SeasonStateData,
  ) {
    return this.proposalsService.setSeasonClosed(id, isClosed);
  }

  @Delete('seasons/:id')
  @UseGuards(AuthGuard, AdminGuard)
  deleteSeason(@Param('id') id: string) {
    return this.proposalsService.deleteSeason(id);
  }

  @Post()
  @UseGuards(AuthGuard, AdminGuard)
  createProposal(
    @Body({ schema: CreateProposalData }) proposal: CreateProposalData,
  ) {
    return this.proposalsService.createProposal(proposal);
  }

  @Put(':id')
  @UseGuards(AuthGuard, AdminGuard)
  updateProposal(
    @Param('id') id: string,
    @Body({ schema: UpdateProposalData }) proposal: UpdateProposalData,
  ) {
    return this.proposalsService.updateProposal(id, proposal);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, AdminGuard)
  deleteProposal(@Param('id') id: string) {
    return this.proposalsService.deleteProposal(id);
  }

  @Put(':id/join')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Join with roles, or withdraw with an empty list' })
  join(
    @Param('id') id: string,
    @CurrentUser() user: ValidatedUser,
    @Body({ schema: ParticipationData }) { roles }: ParticipationData,
  ) {
    return this.proposalsService.setParticipation(user.username, id, roles);
  }

  @Put(':id/participants/:userName')
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Change roles of a participant, or remove them' })
  setParticipantRoles(
    @Param('id') id: string,
    @Param('userName') userName: string,
    @Body({ schema: ParticipationData }) { roles }: ParticipationData,
  ) {
    return this.proposalsService.setParticipantRoles(id, userName, roles);
  }
}
