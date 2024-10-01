import { Module } from '@nestjs/common';
import { DatabaseModule } from '@db/database.module';
import { MembersService } from './members.service';
import { membersProviders } from './members.provider';
import { MembersController } from './members.controller';
import { SettingController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [DatabaseModule],
  providers: [MembersService, SettingsService, ...membersProviders],
  exports: [MembersService],
  controllers: [MembersController, SettingController],
})
export class MembersModule {}
