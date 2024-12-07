import { Injectable, NotFoundException } from '@nestjs/common';

interface Movie { 
    id : number;
    title : string;
  }

@Injectable()
export class MovieService {
    
  private movies : Movie[] = [
    {
      id : 1,
      title : '해리포터'
    },
    {
      id : 2,
      title : '반지의 제왕'
    }
  ]

  getMovies(title? : string) : Movie[]{

    if(!title){
      return this.movies;
    } 

    return this.movies.filter((movie) => movie.title.startsWith(title));
  }

  getMovieById(id:string): Movie {
    const movie = this.movies.find((moive) => moive.id === +id);

    if(!movie){
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }

    return movie;
  }

  createMovie(title : string) : Movie[] {
    const movie = {
        id: this.movies.length > 0 ? this.movies[this.movies.length - 1].id + 1 : 1,
        title,
    };

    this.movies = [...this.movies , movie];
    
    return  this.movies;
  }

  updateMovie(id:string,title : string) : Movie {

    const movie = this.getMovieById(id);

    if(title) movie.title = title;

    // movie에 title을 덮어쓴다.
    Object.assign(movie,{title});

    return movie;
  }

  deleteMovie(id:string){
    
    const moiveIndex = this.movies.findIndex((movie) => movie.id === +id);

    if(moiveIndex === -1){
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }

    this.movies.splice(moiveIndex,1)

    return id;
  }

}
