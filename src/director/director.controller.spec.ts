import { Test, TestingModule } from '@nestjs/testing';
import { DirectorController } from './director.controller';
import { DirectorService } from './director.service';
import { CreateDirectorDto } from './dto/create-director.dto';
import { UpdateDirectorDto } from './dto/update-director';

const mockedDirectorService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('DirectorController', () => {
  let directorController: DirectorController;
  let directorServie: DirectorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DirectorController],
      providers: [
        {
          provide: DirectorService,
          useValue: mockedDirectorService,
        },
      ],
    }).compile();
    directorController = module.get<DirectorController>(DirectorController);
  });

  it('should be defined', () => {
    expect(directorController).toBeDefined();
  });

  describe('create', () => {
    it('should return correct value', async () => {
      const createDirectorDto = {
        name: 'codefactory',
      };

      const director = {
        id: 1,
        ...createDirectorDto,
      };

      jest.spyOn(mockedDirectorService, 'create').mockResolvedValue(director);

      const result = await directorController.create(
        createDirectorDto as CreateDirectorDto,
      );
      expect(result).toEqual(director);
      expect(mockedDirectorService.create).toHaveBeenCalledWith(
        createDirectorDto,
      );
    });
  });

  describe('findAll', () => {
    it('should return a list of directors', async () => {
      const directors = [
        {
          id: 1,
          name: 'codefactory1',
        },
        {
          id: 1,
          name: 'codefactory2',
        },
      ];

      jest.spyOn(mockedDirectorService, 'findAll').mockResolvedValue(directors);

      const result = await directorController.findAll();

      expect(result).toEqual(directors);
      expect(mockedDirectorService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single director', async () => {
      const director = {
        id: 1,
        name: 'codefactory1',
      };

      jest.spyOn(mockedDirectorService, 'findOne').mockResolvedValue(director);

      const result = await directorController.findOne(director.id);
      expect(mockedDirectorService.findOne).toHaveBeenCalledWith(director.id);
      expect(result).toEqual(director);
    });
  });

  describe('update', () => {
    it('should return the updated user', async () => {
      const id = 1;
      const updateDirectorDto: UpdateDirectorDto = {
        name: 'codefactory1',
      };
      const director = {
        id,
        updateDirectorDto,
      };

      jest.spyOn(mockedDirectorService, 'update').mockResolvedValue(director);

      const result = await directorController.update(id, updateDirectorDto);
      expect(mockedDirectorService.update).toHaveBeenCalledWith(
        id,
        updateDirectorDto,
      );
      expect(result).toEqual(director);
    });
  });

  describe('remove', () => {
    it('should return the deleted directorId', async () => {
      const id = 1;

      jest.spyOn(mockedDirectorService, 'remove').mockResolvedValue(id);

      const result = await directorController.remove(id);
      expect(mockedDirectorService.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual(id);
    });
  });
});
