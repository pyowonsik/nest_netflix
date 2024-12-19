import { IsInt, IsOptional, IsString } from 'class-validator';
import { CursorPaginaitionDto } from 'src/common/dto/cursor-pagination.dto';
import { PagePaginationDto } from 'src/common/dto/page-pagination.dto';

export class GetMovieDto extends CursorPaginaitionDto {
  @IsString()
  @IsOptional()
  title: string;
}
