import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from 'src/database/database.module';
import { UserService } from './users.service';
import { userProviders } from './users.provider';
import { UserController } from './users.controller';
import { TrackService } from './track.service';
import { SettingController } from './setting.controller';

@Module({
  imports: [TypeOrmModule.forFeature([]), DatabaseModule],
  providers: [UserService, TrackService, ...userProviders],
  exports: [UserService],
  controllers: [UserController, SettingController],
})
export class UserModule {}
