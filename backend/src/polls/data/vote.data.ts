import { IsArray, IsString, ArrayMaxSize } from 'class-validator';

export class VoteData {
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(5, { message: 'Обрано більше 5 аніме' })
  animeIds: string[];
}
