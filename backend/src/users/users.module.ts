import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { UserService } from './users.service';
import { userProviders } from './users.provider';
import { UserController } from './users.controller';
import { TrackService } from './tracks.service';
import { SettingController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [DatabaseModule],
  providers: [UserService, TrackService, SettingsService, ...userProviders],
  exports: [UserService],
  controllers: [UserController, SettingController],
})
export class UserModule {}
