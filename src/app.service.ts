import { Injectable, NotFoundException } from '@nestjs/common';
import { time } from 'console';

interface Movie { 
  id : number;
  title : string;
}

@Injectable()
export class AppService {

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

  getMovieById(id:string): Movie {
    const movie = this.movies.find((moive) => moive.id === +id);

    if(!movie){
      throw new NotFoundException('Movie not found');
    }

    return movie;
  }
}
