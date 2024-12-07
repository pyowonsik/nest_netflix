import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query,  } from '@nestjs/common';
import { MovieService } from './movie.service';
import { time } from 'console';
import { title } from 'process';


interface Movie { 
  id : number;
  title : string;
}

@Controller('movie')
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
    @Body('title') title : string
  ) : Movie[] {
    return this.movieService.createMovie(title)
  }

  @Put(':id')
  putMovie(
    @Param('id') id : string,
    @Body('title') title : string
  ) : Movie{
    return this.movieService.updateMovie(id,title);
  }

  @Delete(':id')
  deleteMovie(
    @Param('id') id : string
  ){
    return  this.movieService.deleteMovie(id);
  }
}
