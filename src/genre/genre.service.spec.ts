import { Test, TestingModule } from '@nestjs/testing';
import { GenreService } from './genre.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Genre } from './entities/genre.entity';
import { CreateGenreDto } from './dto/create-genre.dto';
import { NotFoundException } from '@nestjs/common';
import { UpdateGenreDto } from './dto/update-genre.dto';

const mockGenreRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('GenreService', () => {
  let genreService: GenreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenreService,
        {
          provide: getRepositoryToken(Genre),
          useValue: mockGenreRepository,
        },
      ],
    }).compile();

    genreService = module.get<GenreService>(GenreService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(genreService).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all genres', async () => {
      const genres = [
        {
          id: 1,
          name: 'action',
        },
        {
          id: 2,
          name: 'fantasy',
        },
      ];

      jest.spyOn(mockGenreRepository, 'find').mockResolvedValue(genres);

      const result = await genreService.findAll();

      expect(result).toEqual(genres);
      expect(mockGenreRepository.find).toHaveBeenCalled();
    });
  });

  describe('find', () => {
    it('should return a director by id', async () => {
      const genre = {
        id: 1,
        name: 'action',
      };

      jest.spyOn(mockGenreRepository, 'findOne').mockResolvedValue(genre);

      // 실제로 service.findOne()을 호출한 genre값 을 미리 정의한 genre와 비교
      const result = await genreService.findOne(genre.id);

      expect(result).toEqual(genre);
      expect(mockGenreRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: genre.id,
        },
      });
    });
  });

  describe('create', () => {
    it('should return correct value', async () => {
      const createGenreDto = {
        name: 'action',
      };

      jest.spyOn(mockGenreRepository, 'save').mockResolvedValue(createGenreDto);

      const result = await genreService.create(createGenreDto);

      expect(mockGenreRepository.save).toHaveBeenCalledWith(createGenreDto);
      expect(result).toEqual(createGenreDto);
    });
  });

  describe('update', () => {
    it('should update a director return the updated director', async () => {
      const updateGenreDto = {
        name: 'fantasy',
      };
      const genre = {
        id: 1,
        name: 'action',
      };

      const updatedGenre = {
        genre,
        ...updateGenreDto,
      };

      jest.spyOn(mockGenreRepository, 'findOne').mockResolvedValueOnce(genre);

      jest
        .spyOn(mockGenreRepository, 'findOne')
        .mockResolvedValueOnce(updatedGenre);

      const result = await genreService.update(genre.id, updateGenreDto);

      expect(mockGenreRepository.findOne).toHaveBeenNthCalledWith(1, {
        where: {
          id: genre.id,
        },
      });
      expect(mockGenreRepository.update).toHaveBeenCalledWith(
        { id: genre.id },
        updateGenreDto,
      );

      expect(result).toEqual(updatedGenre);
    });

    it('should throw a NotFoundException if genre to update is not founc', async () => {
      jest.spyOn(mockGenreRepository, 'findOne').mockResolvedValue(null);

      const updateGenreDto: UpdateGenreDto = {
        name: 'action',
      };

      // result = genreService.remove(1);
      expect(genreService.update(999, updateGenreDto)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockGenreRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 999,
        },
      });
      expect(mockGenreRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a remove by id', async () => {
      const genre = {
        id: 1,
        naem: 'action',
      };

      jest.spyOn(mockGenreRepository, 'findOne').mockResolvedValue(genre);

      const result = await genreService.remove(genre.id);

      expect(result).toEqual(genre.id);
      expect(mockGenreRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: genre.id,
        },
      });
      expect(mockGenreRepository.delete).toHaveBeenCalledWith(genre.id);
    });

    it('should throw a NotFoundException if director to delete not found', async () => {
      jest.spyOn(mockGenreRepository, 'findOne').mockResolvedValue(null);
      // result = genreService.remove(1);
      expect(genreService.remove(1)).rejects.toThrow(NotFoundException);
    });
  });
});
