import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserData {
  @ApiProperty()
  name: string;

  @ApiProperty()
  types: string[];

  @ApiProperty()
  coins: number;
}
