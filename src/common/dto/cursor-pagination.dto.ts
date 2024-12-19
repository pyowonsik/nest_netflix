import { IsIn, IsInt, IsOptional } from 'class-validator';

export class CursorPaginaitionDto {
  @IsInt()
  @IsOptional()
  id: number;

  @IsIn(['DESC', 'ASC'])
  @IsOptional()
  order: 'DESC' | 'ASC' = 'DESC';

  @IsInt()
  @IsOptional()
  take: number = 5;
}
