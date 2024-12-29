import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';
import { number } from 'joi';

export class CreateMovieDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  detail: string;

  @IsNotEmpty()
  @IsNumber()
  directorId: number;

  @IsNotEmpty()
  @ArrayNotEmpty()
  @IsNumber(
    {},
    {
      each: true,
    },
  )
  @Type(() => Number)
  genreIds: number[];

  @IsString()
  movieFileName: string;
}
