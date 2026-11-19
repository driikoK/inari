import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { CodexController } from './codex.controller.js';
import { codexProviders } from './codex.provider.js';
import { CodexService } from './codex.service.js';

@Module({
  imports: [DatabaseModule],
  providers: [CodexService, ...codexProviders],
  controllers: [CodexController],
})
export class CodexModule {}
