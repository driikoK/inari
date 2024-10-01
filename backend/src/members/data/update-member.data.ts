import { ApiProperty } from '@nestjs/swagger';

export class UpdateMemberData {
  @ApiProperty()
  name: string;

  @ApiProperty()
  types: string[];

  @ApiProperty()
  coins: number;
}
