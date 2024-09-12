import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypesEnum } from '../enums/types.enum';

export class MemberInfo {
  @ApiProperty()
  nickname: string;

  @ApiProperty()
  nameTitle: string;

  @ApiPropertyOptional({ nullable: true })
  note?: string;

  @ApiProperty()
  currentEpisode: number;

  @ApiProperty()
  typeRole: TypesEnum;

  @ApiProperty()
  coin: number;

  @ApiPropertyOptional()
  isGuest?: boolean;
}

export class CreateTrackData {
  @ApiProperty({ type: [MemberInfo] })
  membersInfo: MemberInfo[];

  @ApiPropertyOptional()
  isFast?: boolean;

  @ApiPropertyOptional()
  isOngoing?: boolean;

  @ApiPropertyOptional()
  isPriority?: boolean;

  @ApiPropertyOptional()
  isInTime?: boolean;
}
