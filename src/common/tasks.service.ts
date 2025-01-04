import { Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { readdir, unlink } from 'fs/promises';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { join, parse } from 'path';
import { DefaultLogger } from 'src/movie/entity/default.logger';
import { Movie } from 'src/movie/entity/movie.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TasksService {
  // private readonly logger = new Logger(TasksService.name); // nestjs logger
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    // private readonly logger: DefaultLogger,  // nestjs custom logger
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService, // winston logger
  ) {}

  // Cron을 사용해 로그 찍기
  @Cron('*/5 * * * * *')
  logEverySeconds() {
    this.logger.fatal('fatal 레벨 로그', null, TasksService.name);
    this.logger.error('error 레벨 로그', null, TasksService.name);
    this.logger.warn('warn 레벨 로그', TasksService.name);
    this.logger.log('log 레벨 로그', TasksService.name);
    this.logger.debug('debug 레벨 로그', TasksService.name);
    this.logger.verbose('verbose 레벨 로그', TasksService.name);
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
