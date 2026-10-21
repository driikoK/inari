import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { ProposalsController } from './proposals.controller.js';
import { proposalsProviders } from './proposals.provider.js';
import { ProposalsService } from './proposals.service.js';

@Module({
  imports: [DatabaseModule],
  providers: [ProposalsService, ...proposalsProviders],
  controllers: [ProposalsController],
  exports: [ProposalsService],
})
export class ProposalsModule {}
