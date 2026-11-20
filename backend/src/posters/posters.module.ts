import { Module } from '@nestjs/common';
import { PostersService } from './posters.service.js';

@Module({
  providers: [PostersService],
  exports: [PostersService],
})
export class PostersModule {}
