import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MEMBER_ROLE } from '../enums/types.enum';

export class MemberInfo {
  @ApiProperty()
  nickname: string;

  @ApiProperty()
  typeRole: MEMBER_ROLE;

  @ApiProperty()
  coins: number;

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

  @ApiProperty()
  currentEpisode: number;

  @ApiProperty()
  nameTitle: string;

  @ApiProperty()
  titleType: string;

  @ApiPropertyOptional({ nullable: true })
  note?: string;
}
