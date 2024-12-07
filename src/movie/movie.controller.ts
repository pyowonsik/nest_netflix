import { Body, ClassSerializerInterceptor, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseInterceptors,  } from '@nestjs/common';
import { MovieService } from './movie.service';
import { time } from 'console';
import { title } from 'process';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { ClassTransformer } from 'class-transformer';

@Controller('movie')
// class-transform : 변환
// class-transformer 사용 -> ( @Expose , @Exclude , @Transform )
@UseInterceptors(ClassSerializerInterceptor) 
export class MovieController {
  constructor(private readonly movieService: MovieService) {}


  @Get()
  getMovies(
    @Query('title') title? : string,
  ) : Movie[]{
    return this.movieService.getMovies(title);
  }

  @Get(':id')
  getMovie(@Param('id') id : string): Movie{
    return this.movieService.getMovieById(id)
  }

  @Post()
  postMoive(
    @Body() body : CreateMovieDto
  ) : Movie[] {
    return this.movieService.createMovie(body)
  }

  @Put(':id')
  putMovie(
    @Param('id') id : string,
    @Body() body : UpdateMovieDto
  ) : Movie{
    return this.movieService.updateMovie(id,body);
  }

  @Delete(':id')
  deleteMovie(
    @Param('id') id : string
  ){
    return  this.movieService.deleteMovie(id);
  }
}
