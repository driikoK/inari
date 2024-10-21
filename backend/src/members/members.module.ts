import { Module } from '@nestjs/common';
import { DatabaseModule } from '@db/database.module';
import { MembersService } from './members.service';
import { membersProviders } from './members.provider';
import { MembersController } from './members.controller';

@Module({
  imports: [DatabaseModule],
  providers: [MembersService, ...membersProviders],
  exports: [MembersService],
  controllers: [MembersController],
})
export class MembersModule {}
