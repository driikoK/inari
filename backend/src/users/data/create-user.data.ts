import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserData {
  @ApiProperty()
  name: string;

  @ApiProperty()
  types: string[];

  @ApiPropertyOptional({
    type: Number,
  })
  coin = 0;
}
