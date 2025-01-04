import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { readdir, unlink } from 'fs/promises';
import { join, parse } from 'path';
import { Movie } from 'src/movie/entity/movie.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
  ) {}

  // Cron을 사용해 로그 찍기
  // @Cron('* * * * * *')
  logEverySeconds() {
    console.log('1초마다 실행');
  }

  // Cron을 사용해 잉여 파일 삭제
  // @Cron('* * * * * *')
  async eraseOrphanFiles() {
    const file = await readdir(join(process.cwd(), 'public', 'temp'));

    const deleteFilesTargets = file.filter((file) => {
      const fileName = parse(file).name;

      const split = fileName.split('_');

      if (split.length != 2) {
        return true;
      }

      try {
        const date = +new Date(parseInt(split[split.length - 1]));

        const aDayInMilSec = +(24 * 60 * 60 * 1000);

        const now = +new Date();

        return now - date > aDayInMilSec;
      } catch {
        return true;
      }
    });

    await Promise.all(
      deleteFilesTargets.map((x) =>
        unlink(join(process.cwd(), 'public', 'temp', x)),
      ),
    );
  }

  // Cron을 사용해 like,dislike count 통계 계산
  // @Cron('0 * * * * *')
  async calculateMovieLikeCount() {
    await this.movieRepository.query(`
  UPDATE movie m
  SET "likeCount" = 
  ( SELECT count(*) FROM movie_user_like mul
    WHERE m.id = mul."movieId" AND mul."isLike" = true)
`);
    await this.movieRepository.query(`
  UPDATE movie m
  SET "dislikeCount" = 
  ( SELECT count(*) FROM movie_user_like mul
    WHERE m.id = mul."movieId" AND mul."isLike" = false )
  `);
  }
}
