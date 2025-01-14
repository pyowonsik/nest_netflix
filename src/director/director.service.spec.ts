import { Test, TestingModule } from '@nestjs/testing';
import { DirectorService } from './director.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Director } from './entity/director.entity';
import { Repository } from 'typeorm';
import { CreateDirectorDto } from './dto/create-director.dto';
import { dir } from 'console';
import { UpdateDirectorDto } from './dto/update-director';
import { NotFoundException } from '@nestjs/common';

const mockDirectorRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('DirectorService', () => {
  let directorService: DirectorService;
  let directorRepository: Repository<Director>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        // service
        DirectorService,
        // repository method mocking
        {
          provide: getRepositoryToken(Director),
          useValue: mockDirectorRepository,
        },
      ],
    }).compile();

    directorService = module.get<DirectorService>(DirectorService);
    directorRepository = module.get<Repository<Director>>(
      getRepositoryToken(Director),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(directorService).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all directors', async () => {
      const directors = [
        {
          id: 1,
          name: 'codefactory',
        },
      ];

      jest.spyOn(mockDirectorRepository, 'find').mockResolvedValue(directors);

      const result = await directorService.findAll();

      expect(mockDirectorRepository.find).toHaveBeenCalled();
      expect(result).toEqual(directors);
    });
  });

  describe('findOne', () => {
    it('should return a director by id', async () => {
      const dircetor = {
        id: 1,
        name: 'codefactory',
      };

      jest.spyOn(mockDirectorRepository, 'findOne').mockResolvedValue(dircetor);

      const result = await directorService.findOne(dircetor.id);

      expect(mockDirectorRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: dircetor.id,
        },
      });
      expect(result).toEqual(dircetor);
    });
  });

  describe('create', () => {
    it('should create a new director and return it', async () => {
      const createDirectorDto = {
        name: 'codefactory',
      };

      jest
        .spyOn(mockDirectorRepository, 'save')
        .mockResolvedValue(createDirectorDto);

      const result = await directorService.create(
        createDirectorDto as CreateDirectorDto,
      );

      expect(mockDirectorRepository.save).toHaveBeenCalledWith(
        createDirectorDto,
      );
      expect(result).toEqual(createDirectorDto);
    });
  });

  describe('update', () => {
    it('should update a director return the updated director', async () => {
      const updateDirectorDto = {
        name: 'codefactory',
      };
      const existingDirector = {
        id: 1,
        name: 'codefactory',
      };
      const updatedDirector = {
        id: 1,
        name: 'codefactory2',
      };

      jest
        .spyOn(mockDirectorRepository, 'findOne')
        .mockResolvedValue(existingDirector);
      jest
        .spyOn(mockDirectorRepository, 'findOne')
        .mockResolvedValue(updatedDirector);

      const result = await directorService.update(1, updateDirectorDto);

      expect(mockDirectorRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });
      expect(mockDirectorRepository.update).toHaveBeenCalledWith(
        { id: 1 },
        updateDirectorDto,
      );
      expect(result).toEqual(updatedDirector);
    });

    it('should throw a NotFoundException if director to update is not found', async () => {
      jest.spyOn(mockDirectorRepository, 'findOne').mockResolvedValue(null);

      const updateDirectorDto: UpdateDirectorDto = {
        name: 'codefactory',
      };

      // NotFoundException 테스트
      expect(directorService.update(999, updateDirectorDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockDirectorRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 999,
        },
      });
      expect(mockDirectorRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a user by id', async () => {
      const director = {
        id: 1,
        name: 'codefactory',
      };

      jest.spyOn(mockDirectorRepository, 'findOne').mockResolvedValue(director);

      const result = await directorService.remove(director.id);

      expect(result).toEqual(director.id);
      expect(mockDirectorRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: director.id,
        },
      });
      expect(mockDirectorRepository.delete).toHaveBeenCalledWith(director.id);
    });

    it('should throw a NotFoundException if director to delete not found', async () => {
      jest.spyOn(mockDirectorRepository, 'findOne').mockResolvedValue(null);
      expect(directorService.remove(1)).rejects.toThrow(NotFoundException);
    });
  });
});
