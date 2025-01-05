import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ClassSerializerInterceptor,
  UseInterceptors,
  ParseIntPipe,
} from '@nestjs/common';
import { GenreService } from './genre.service';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('genre')
@ApiTags('genre')
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class GenreController {
  constructor(private readonly genreService: GenreService) {}

  @Post()
  create(@Body() createGenreDto: CreateGenreDto) {
    return this.genreService.create(createGenreDto);
  }

  @Get()
  findAll() {
    return this.genreService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: string) {
    return this.genreService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: string,
    @Body() updateGenreDto: UpdateGenreDto,
  ) {
    return this.genreService.update(+id, updateGenreDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: string) {
    return this.genreService.remove(+id);
  }
}
