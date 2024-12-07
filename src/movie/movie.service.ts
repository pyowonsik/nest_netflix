import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';

@Injectable()
export class MovieService {
  private movies: Movie[] = [];

  constructor() {
    const movie1 = new Movie();
    movie1.id = 1;
    movie1.title = '해리포터1';
    movie1.genre = 'fantasy';

    const movie2 = new Movie();
    movie2.id = 2;
    movie2.title = '반지의제왕';
    movie2.genre = 'action';

    this.movies.push(movie1, movie2);
  }

  getMovies(title?: string): Movie[] {
    if (!title) {
      return this.movies;
    }

    return this.movies.filter((movie) => movie.title.startsWith(title));
  }

  getMovieById(id: string): Movie {
    const movie = this.movies.find((moive) => moive.id === +id);

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }

    return movie;
  }

  createMovie(createMovieDto: CreateMovieDto): Movie[] {
    const movie = {
      id:
        this.movies.length > 0 ? this.movies[this.movies.length - 1].id + 1 : 1,
      ...createMovieDto,
      // 'description' : 'test'
    };

    this.movies = [...this.movies, movie];

    return this.movies;
  }

  updateMovie(id: string, updateMovieDto: UpdateMovieDto): Movie {
    const movie = this.getMovieById(id);

    // movie에 title을 덮어쓴다.
    Object.assign(movie, { ...updateMovieDto });

    return movie;
  }

  deleteMovie(id: string) {
    const moiveIndex = this.movies.findIndex((movie) => movie.id === +id);

    if (moiveIndex === -1) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }

    this.movies.splice(moiveIndex, 1);

    return id;
  }
}
