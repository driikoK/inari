import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MEMBER_ROLE } from '@users/enums/types.enum';

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

  @ApiPropertyOptional()
  isGiveEditorCoins?: boolean;

  @ApiPropertyOptional()
  isGiveTypesetterCoins?: boolean;

  @ApiPropertyOptional()
  isGuest?: boolean;

  @ApiProperty()
  currentEpisode: number;

  @ApiProperty()
  nameTitle: string;

  @ApiProperty()
  titleType: string;

  @ApiProperty()
  season: string;

  @ApiProperty()
  year: number;

  @ApiPropertyOptional({ nullable: true })
  note?: string;
}
