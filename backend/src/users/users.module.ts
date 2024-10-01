import { Module } from '@nestjs/common';
import { DatabaseModule } from '@db/database.module';
import { UserService } from './users.service';
import { userProviders } from './users.provider';
import { UserController } from './users.controller';
import { SettingController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [DatabaseModule],
  providers: [UserService, SettingsService, ...userProviders],
  exports: [UserService],
  controllers: [UserController, SettingController],
})
export class UserModule {}
