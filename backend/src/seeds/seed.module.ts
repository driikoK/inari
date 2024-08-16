import { Module } from '@nestjs/common';
import { SeedCommand } from './seed.command';
import { UserModule } from 'src/users/users.module';

@Module({
  imports: [UserModule],
  providers: [SeedCommand],
})
export class SeedModule {}
