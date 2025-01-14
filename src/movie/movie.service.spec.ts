import { Test, TestingModule } from '@nestjs/testing';
import { MovieService } from './movie.service';
import { TestBed } from '@automock/jest';
import { DataSource, Repository } from 'typeorm';
import { Movie } from './entity/movie.entity';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { User } from 'src/user/entities/user.entity';
import { Genre } from 'src/genre/entities/genre.entity';
import { Director } from 'src/director/entity/director.entity';
import { MovieDetail } from './entity/movie-detail.entity';
import { CommonService } from 'src/common/common.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

describe('MovieService', () => {
  let movieService: MovieService;
  let movieRepository: jest.Mocked<Repository<Movie>>;
  let movieDetailRepository: jest.Mocked<Repository<MovieDetail>>;
  let directorRepository: jest.Mocked<Repository<Director>>;
  let genreRepository: jest.Mocked<Repository<Genre>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let movieUserLikeRepository: jest.Mocked<Repository<MovieUserLike>>;
  let dataSource: jest.Mocked<DataSource>;
  let commonService: jest.Mocked<CommonService>;
  let cacheManager: Cache;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(MovieService).compile();

    movieService = unit;
    movieRepository = unitRef.get(getRepositoryToken(Movie) as string);
    movieDetailRepository = unitRef.get(
      getRepositoryToken(MovieDetail) as string,
    );
    directorRepository = unitRef.get(getRepositoryToken(MovieDetail) as string);
    genreRepository = unitRef.get(getRepositoryToken(MovieDetail) as string);
    userRepository = unitRef.get(getRepositoryToken(MovieDetail) as string);
    movieUserLikeRepository = unitRef.get(
      getRepositoryToken(MovieDetail) as string,
    );
    dataSource = unitRef.get(DataSource);
    commonService = unitRef.get(CommonService);
    cacheManager = unitRef.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(movieService).toBeDefined();
  });

  describe('findRecent', () => {
    it('should return  recent movies from cache', async () => {
      const cachedMovies = [
        {
          id: 1,
          title: 'movie1',
        },
      ];

      jest.spyOn(cacheManager, 'get').mockResolvedValue(cachedMovies);

      const reuslt = await movieService.findRecent();

      expect(cacheManager.get).toHaveBeenCalledWith('MOVIE_RECENT');
      expect(reuslt).toEqual(cachedMovies);
    });

    it('should fetch recent movies from the repository and cache them if not found in cache', async () => {
      const recentMovies = [
        {
          id: 1,
          title: 'Movie 1',
        },
      ];

      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
      jest
        .spyOn(movieRepository, 'find')
        .mockResolvedValue(recentMovies as Movie[]);

      const result = await movieService.findRecent();

      expect(cacheManager.get).toHaveBeenCalledWith('MOVIE_RECENT');
      expect(cacheManager.set).toHaveBeenCalledWith(
        'MOVIE_RECENT',
        recentMovies,
      );
      expect(result).toEqual(recentMovies);
    });
  });

  describe('findAll', () => {
    let getMoviesMock: jest.SpyInstance;
    let getLikedMovieMock: jest.SpyInstance;

    beforeEach(() => {
      getMoviesMock = jest.spyOn(movieService, 'getMovies');
      getLikedMovieMock = jest.spyOn(movieService, 'getLikedMovies');
    });

    it('should return a list of movies without user likes', async () => {});
  });
});
