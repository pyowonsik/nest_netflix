import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Like, QueryRunner, Repository } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { GetMovieDto } from './dto/get-movie.dto';
import { CommonService } from 'src/common/common.service';
import { join } from 'path';
import { json } from 'stream/consumers';
import { rename } from 'fs/promises';
import { User } from 'src/user/entity/user.entity';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { TasksService } from 'src/common/tasks.service';
import { ConfigService } from '@nestjs/config';
import { envVariableKeys } from 'src/common/const/env.const';

@Injectable()
export class MovieService {
  // repository 의존성 주입
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(MovieDetail)
    private readonly movieDetailRepository: Repository<MovieDetail>,
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(MovieUserLike)
    private readonly movieUserLikeRepository: Repository<MovieUserLike>,
    private readonly dataSource: DataSource,
    private readonly commonService: CommonService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {}

  async findRecent() {
    const cacheData = await this.cacheManager.get('MOVIE_RECENT');

    if (cacheData) {
      return cacheData;
    }

    const data = await this.movieRepository.find({
      order: {
        createdAt: 'DESC',
      },
      take: 10,
    });

    await this.cacheManager.set('MOVIE_RECENT', data);

    return data;
  }

  // istanbul ignore next -> 테스트 하지말고 넘어가라
  // typeorm 메서드를 테스트할 필요 없음

  /* istanbul ignore next */
  async getMovies() {
    return this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres');
  }

  /* istanbul ignore next */
  async getLikedMovies(movieIds: number[], userId: number) {
    return this.movieUserLikeRepository
      .createQueryBuilder('mul')
      .leftJoinAndSelect('mul.movie', 'movie')
      .leftJoinAndSelect('mul.user', 'user')
      .where('movie.id IN(:...movieIds)', { movieIds })
      .where('user.id = :userId', { userId })
      .getMany();
  }

  async findAll(dto: GetMovieDto, userId?: number) {
    const { title } = dto;

    const qb = await this.getMovies();

    if (title) {
      qb.where('movie.title LIKE :title', { title: `%${title}%` });
    }

    // if (take && page) {
    // this.commonService.applyPagePaginationParamsToQb(qb, dto);
    // }

    const { nextCursor } =
      await this.commonService.applyCursorPaginationParamsToQb(qb, dto);

    let [data, count] = await qb.getManyAndCount();

    if (userId) {
      const movieIds = data.map((movie) => movie.id);

      // likeMovie = 페이지네이션을 마친 data에서 좋아요 또는 싫어요를 한 데이터
      const likedMovie = await this.getLikedMovies(movieIds, userId);

      const likeMovieMap = likedMovie.reduce(
        (acc, next) => ({
          ...acc,
          [next.movie.id]: next.isLike,
        }),
        {},
      );
      // console.log(likeMovieMap); // { '1': true, '2': true, '3': true, '5': false }

      // return 하려는 data에 likeMovieMap 필드 추가
      data = data.map((x) => ({
        ...x,
        likeStatus: x.id in likeMovieMap ? likeMovieMap[x.id] : null,
      }));
    }

    // 기존 반환값에 cursor를 넣어줌
    return {
      data,
      nextCursor,
      count,
    };
  }

  /* istanbul ignore next */
  async findMovieDetail(id: number) {
    return this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres')
      .leftJoinAndSelect('movie.creator', 'creator')
      .leftJoinAndSelect('movie.detail', 'detail')
      .where('movie.id = :id', { id })
      .getOne();
  }

  async findOne(id: number) {
    const movie = await this.findMovieDetail(id);

    // const movie = await this.movieRepository.findOne({
    //   where: {
    //     id,
    //   },
    //   relations: ['detail', 'director', 'genres'],
    // });

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }
    return movie;
  }

  /* istanbul ignore next */
  async createMovieDetail(qr: QueryRunner, createMovieDto: CreateMovieDto) {
    return qr.manager
      .createQueryBuilder()
      .insert()
      .into(MovieDetail)
      .values({
        detail: createMovieDto.detail,
      })
      .execute();
  }

  /* istanbul ignore next */
  async createMovie(
    qr: QueryRunner,
    createMovieDto: CreateMovieDto,
    director: Director,
    movieDetailId: number,
    userId: number,
    movieFolder: string,
  ) {
    return qr.manager
      .createQueryBuilder()
      .insert()
      .into(Movie)
      .values({
        title: createMovieDto.title,
        detail: {
          id: movieDetailId,
        },
        director,
        creator: {
          id: userId,
        },
        // movieFile을 이동 시켜주면서 movie 테이블에도 저장한다.
        movieFilePath: join(movieFolder, createMovieDto.movieFileName),
      })
      .execute();
  }

  /* istanbul ignore next */
  async createMovieGenreRelation(
    qr: QueryRunner,
    movieId: number,
    genres: Genre[],
  ) {
    return qr.manager
      .createQueryBuilder()
      .relation(Movie, 'genres')
      .of(movieId)
      .add(genres.map((genre) => genre.id));
  }

  /* istanbul ignore next */
  async renameMovieFile(
    tempFolder: string,
    movieFolder: string,
    createMovieDto: CreateMovieDto,
  ) {
    if (this.configService.get<string>(envVariableKeys.env) !== 'prod') {
      return rename(
        join(process.cwd(), tempFolder, createMovieDto.movieFileName),
        join(process.cwd(), movieFolder, createMovieDto.movieFileName),
      );
    } else {
      return this.commonService.saveMovieToPermanentStorage(
        createMovieDto.movieFileName,
      );
    }
  }

  async create(
    createMovieDto: CreateMovieDto,
    userId: number,
    qr: QueryRunner,
  ) {
    const director = await qr.manager.findOne(Director, {
      where: {
        id: createMovieDto.directorId,
      },
    });

    if (!director) {
      throw new NotFoundException('존재하지 않는 ID의 감독입니다.');
    }

    const genres = await qr.manager.find(Genre, {
      where: {
        id: In(createMovieDto.genreIds),
      },
    });

    if (genres.length !== createMovieDto.genreIds.length) {
      throw new NotFoundException(
        `존재하지 않는 장르가 있습니다! 존재하는 ids -> ${genres.map((genre) => genre.id).join(',')}`,
      );
    }

    // -> repository

    // const movie = await this.movieRepository.save({
    //   title: createMovieDto.title,
    //   detail: {
    //     detail: createMovieDto.detail,
    //   },
    //   director,
    //   genres,
    // });

    // -> query builder

    // (1). queryBuilder 사용시 cascade를 허용하지 않기 때문에
    // movieDetail 테이블에 detail을 insert 하면서
    // movieDetail 을 반환받는다.
    const movieDetail = await this.createMovieDetail(qr, createMovieDto);

    const movieDetailId = movieDetail.identifiers[0].id;

    // movie 생성시, temp폴더의 movieFile을 movie폴더로 이동 시킨다.
    const movieFolder = join('public', 'movie');
    const tempFolder = join('public', 'temp');

    // (1)에서 반환 받은 movieDetailId를 이용하여 movie 테이블에서
    // movieDetail,director를 movie에 저장
    const movie = await this.createMovie(
      qr,
      createMovieDto,
      director,
      movieDetailId,
      userId,
      movieFolder,
    );

    const movieId = movie.identifiers[0].id;

    await this.renameMovieFile(tempFolder, movieFolder, createMovieDto);

    // (2) one to many 관계 일  경우 .relation()을 통해 관계를 만들어줘야함.
    await this.createMovieGenreRelation(qr, movieId, genres);

    return await qr.manager.findOne(Movie, {
      where: {
        id: movieId,
      },
      relations: ['detail', 'director', 'genres'],
    });
  }

  /* istanbul ignore next */
  async updateMovie(
    qr: QueryRunner,
    movieUpdateFields: UpdateMovieDto,
    id: number,
  ) {
    return qr.manager
      .createQueryBuilder()
      .update(Movie)
      .set(movieUpdateFields)
      .where('id = :id', { id })
      .execute();
  }

  /* istanbul ignore next */
  async updateMovieDetail(qr: QueryRunner, detail: string, movie: Movie) {
    return qr.manager
      .createQueryBuilder()
      .update(MovieDetail)
      .set({ detail })
      .where('id = :id', {
        id: movie.detail.id,
      })
      .execute();
  }
  /* istanbul ignore next */
  async updateMovieGenreRelation(
    qr: QueryRunner,
    id: number,
    newGenres: Genre[],
    movie: Movie,
  ) {
    return qr.manager
      .createQueryBuilder()
      .relation(Movie, 'genres')
      .of(id)
      .addAndRemove(
        newGenres.map((genre) => genre.id),
        movie.genres.map((genre) => genre.id),
      );
  }

  async update(id: number, updateMovieDto: UpdateMovieDto) {
    const qr = this.dataSource.createQueryRunner();

    await qr.connect();
    await qr.startTransaction();

    try {
      const movie = await qr.manager.findOne(Movie, {
        where: {
          id,
        },
        relations: ['detail', 'director', 'genres'],
      });

      if (!movie) {
        throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
      }

      const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;

      let newDirector;

      if (directorId) {
        const director = await qr.manager.findOne(Director, {
          where: {
            id: directorId,
          },
        });

        if (!director) {
          throw new NotFoundException('존재하지 않는 ID의 감독입니다.');
        }

        newDirector = director;
      }

      let newGenres;

      if (genreIds) {
        const genres = await qr.manager.find(Genre, {
          where: {
            id: In(genreIds),
          },
        });

        if (genres.length !== updateMovieDto.genreIds.length) {
          throw new NotFoundException(
            `존재하지 않는 장르가 있습니다! 존재하는 ids -> ${genres.map((genre) => genre.id).join(',')}`,
          );
        }

        newGenres = genres;
      }

      const movieUpdateFields = {
        ...movieRest,
        ...(newDirector && { director: newDirector }),
      };

      // movie update
      // await this.movieRepository.update({ id }, movieUpdateFields);
      await this.updateMovie(qr, movieUpdateFields, id);

      // movie detail update
      if (detail) {
        // await this.movieDetailRepository.update(
        //   {
        //     id: movie.detail.id,
        //   },
        //   {
        //     detail,
        //   },
        // );
        await this.updateMovieDetail(qr, detail, movie);
      }

      // const newMovie = await this.movieRepository.findOne({
      //   where: {
      //     id,
      //   },
      //   relations: ['detail', 'director'],
      // });

      // newMovie.genres = newGenres;

      // await this.movieRepository.save(newMovie);

      // // movie_genres_genre save
      // one to many 관계 일 경우 .relation()을 통해 관계를 만들어줘야함.
      if (newGenres) {
        await this.updateMovieGenreRelation(qr, id, newGenres, movie);
      }
      await qr.commitTransaction();

      return this.movieRepository.findOne({
        where: {
          id,
        },
        relations: ['detail', 'director', 'genres'],
      });
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }

  /* istanbul ignore next */
  async deleteMovie(id: number) {
    return this.movieRepository
      .createQueryBuilder()
      .delete()
      .from('movie')
      .where('id = :id', { id })
      .execute();
  }

  /* istanbul ignore next */
  async deleteMovieMock(movie: Movie) {
    return this.movieDetailRepository.delete(movie.detail.id);
  }

  async delete(id: number) {
    const movie = await this.movieRepository.findOne({
      where: {
        id,
      },
      relations: ['detail'],
    });

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }

    // await this.movieRepository.delete(id);
    await this.deleteMovie(id);

    await this.deleteMovieMock(movie);

    return id;
  }

  /* istanbul ignore next */
  async getLikedRecord(movieId: number, userId: number) {
    return await this.movieUserLikeRepository
      .createQueryBuilder('mul')
      .leftJoinAndSelect('mul.movie', 'movie')
      .leftJoinAndSelect('mul.user', 'user')
      .where('movie.id = :movieId', { movieId })
      .andWhere('user.id = :userId', { userId })
      .getOne();
  }

  /* istanbul ignore next */
  async toggleMovieLike(movieId: number, userId: number, isLike: boolean) {
    const movie = await this.movieRepository.findOne({
      where: {
        id: movieId,
      },
    });

    if (!movie) {
      throw new BadRequestException('존재하지 않는 영화의 id 입니다.');
    }

    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new UnauthorizedException('사용자 정보가 없습니다.');
    }

    const likeRecord = await this.getLikedRecord(movieId, userId);

    if (likeRecord) {
      if (isLike === likeRecord.isLike) {
        // 좋아요에서 좋아요 누르면 삭제
        await this.movieUserLikeRepository.delete({ movie, user });
      } else {
        // 좋아요에서 싫어요 누르면 해당 movie,user 싫어요
        await this.movieUserLikeRepository.update(
          {
            movie,
            user,
          },
          { isLike },
        );
      }
    } else {
      // likeRecord 없다면 해당 movie,user의 movieUserLike 좋아요
      await this.movieUserLikeRepository.save({
        movie,
        user,
        isLike,
      });
    }

    const result = await this.getLikedRecord(movieId, userId);

    return {
      isLike: result && result.isLike,
    };
  }
}
