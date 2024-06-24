import { ApiProperty } from "@nestjs/swagger";
import { TypesEnum } from "../enums/types.enum";

export class FilterTrackData {
    @ApiProperty()
    nickname: string;
    
    @ApiProperty()
    season: number;
    
    @ApiProperty()
    nameTitle: string;
    
    @ApiProperty()
    typeRole: TypesEnum;
}