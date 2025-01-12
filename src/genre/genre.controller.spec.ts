import { Test, TestingModule } from '@nestjs/testing';
import { GenreController } from './genre.controller';
import { GenreService } from './genre.service';

const mockedGenreService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};
describe('GenreController', () => {
  let genreController: GenreController;
  // let genreService: GenreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GenreController],
      providers: [
        {
          provide: GenreService,
          useValue: mockedGenreService,
        },
      ],
    }).compile();
    genreController = module.get<GenreController>(GenreController);
  });

  it('should be defined', () => {
    expect(genreController).toBeDefined();
  });

  describe('findAll', () => {
    it('should return a list of genres', async () => {
      const genres = [
        { id: 1, name: 'action' },
        { id: 2, name: 'fantasy' },
      ];

      jest.spyOn(mockedGenreService, 'findAll').mockResolvedValue(genres);

      const result = await genreController.findAll();

      expect(result).toEqual(genres);
      expect(mockedGenreService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single genre', async () => {
      const genre = { id: 1, name: 'action' };

      jest.spyOn(mockedGenreService, 'findOne').mockResolvedValue(genre);

      const result = await genreController.findOne(genre.id);

      expect(result).toEqual(genre);
      expect(mockedGenreService.findOne).toHaveBeenCalledWith(genre.id);
    });
  });

  describe('create', () => {
    it('should return correct value', async () => {
      const createGenreDto = {
        name: 'action',
      };

      const createdGenre = {
        id: 1,
        ...createGenreDto,
      };

      jest.spyOn(mockedGenreService, 'create').mockResolvedValue(createdGenre);

      const result = await genreController.create(createGenreDto);

      expect(result).toEqual(createdGenre);
      expect(mockedGenreService.create).toHaveBeenCalledWith(createGenreDto);
    });
  });

  describe('update', () => {
    it('should return the updated genre', async () => {
      const updateGenreDto = {
        name: 'action',
      };

      const updatedGenre = {
        id: 1,
        ...updateGenreDto,
      };

      jest.spyOn(mockedGenreService, 'update').mockResolvedValue(updatedGenre);

      const result = await genreController.update(
        updatedGenre.id,
        updateGenreDto,
      );

      expect(result).toEqual(updatedGenre);
      expect(mockedGenreService.update).toHaveBeenCalledWith(
        updatedGenre.id,
        updateGenreDto,
      );
    });
  });

  describe('delete', () => {
    it('should return the deleted genreId', async () => {
      const genre = { id: 1, name: 'action' };

      jest.spyOn(mockedGenreService, 'remove').mockResolvedValue(genre.id);

      const result = await genreController.remove(genre.id);

      expect(result).toEqual(genre.id);
      expect(mockedGenreService.remove).toHaveBeenCalledWith(genre.id);
    });
  });
});
