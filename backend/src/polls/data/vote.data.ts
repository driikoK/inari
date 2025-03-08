import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayMaxSize, IsEnum } from 'class-validator';
import { ROLES_ON_VOTE } from '../enums';

class AnimeRoles {
  @ApiProperty()
  @IsString()
  animeId: string;

  @ApiProperty({
    nullable: true,
    enum: ROLES_ON_VOTE,
    enumName: 'Role',
  })
  @IsArray()
  @ArrayMaxSize(6, { message: 'Обрано забагато ролей' })
  @IsEnum(ROLES_ON_VOTE, { each: true })
  roles: ROLES_ON_VOTE;
}

export class VoteData {
  @ApiProperty()
  @IsArray()
  @ArrayMaxSize(10, { message: 'Обрано більше 10 аніме' })
  votes: AnimeRoles[];
}
