import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { emit } from 'process';

// 의존성 mock
const mockUserRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

// User Service Test
describe('UserService', () => {
  let userService: UserService;

  beforeEach(async () => {
    // 의존성 주입
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user and return it', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@codefactory.ai',
        password: '123123',
      };
      const hashRounds = 10;
      const hashedPassword = 'hashhashhash';
      const result = {
        id: 1,
        email: createUserDto.email,
        password: createUserDto.password,
      };

      // ---------- jest.spyOn : mock method의 반환값 설정 ----------
      // mockResolvedValueOnce와 mockReturnValue의 차이 : async , sync
      // mockResolvedValueOnce : 해당 method가 여러번 호출되면 반환값을 다르게 설정하기 위함.

      // mockUserRepository.findOne()를 감시하고, 반환값을 한번만 null로 설정
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce(null);
      // mockConfigService.get()를 감시하고, 반환값을 hashRounds(10)로 설정
      jest.spyOn(mockConfigService, 'get').mockReturnValue(hashRounds);
      // bcrypt.hash(password,hashRounds)를 감시하고,반환값을 hashedPassword로 설정
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation((password, hashRounds) => hashedPassword);
      // mockUserRepository.findOne()를 다시 감시하고,반환값을 한번만 result로 설정
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce(result);
      //

      // create를 테스트하기 위한것이니 create가 정상적으로 동작되었는지 확인을 위해 create의 반환값 저장 후,
      // 반환값이 맞는지 expect
      const createdUser = await userService.create(createUserDto);
      expect(createdUser).toEqual(result);
      //

      expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(1, {
        where: {
          email: createUserDto.email,
        },
      });
      expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(2, {
        where: {
          email: createUserDto.email,
        },
      });
      expect(mockConfigService.get).toHaveBeenCalledWith(expect.anything());
      expect(bcrypt.hash).toHaveBeenCalledWith(
        createUserDto.password,
        hashRounds,
      );
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        email: createUserDto.email,
        password: hashedPassword,
      });
    });

    it('should throw BadRequestException if email already exists', () => {
      const createUserDto: CreateUserDto = {
        email: 'test@codefactory.ai',
        password: '123123',
      };

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue({
        id: 1,
        email: createUserDto.email,
      });

      // rejects,resolves -> promise
      // BadRequestException 테스트
      expect(userService.create(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          email: createUserDto.email,
        },
      });
    });
  });

  describe('update', () => {
    it('should update a user if it exists and return the updated user', async () => {
      const updateUserDto: UpdateUserDto = {
        email: 'test@codefactory.ai',
        password: '123123',
      };

      const hashRounds = 10;
      const hashedPassword = 'hashhashhash';
      const user = {
        id: 1,
        email: updateUserDto.email,
      };

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce(user);
      jest.spyOn(mockConfigService, 'get').mockReturnValue(hashRounds);
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation((password, hashRounds) => hashedPassword);
      jest.spyOn(mockUserRepository, 'update').mockResolvedValue(undefined);
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce({
        ...user,
        password: hashedPassword,
      });

      const result = await userService.update(1, updateUserDto);
      expect(result).toEqual({
        ...user,
        password: hashedPassword,
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(
        updateUserDto.password,
        hashRounds,
      );
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        { id: 1 },
        { ...updateUserDto, password: hashedPassword },
      );
    });

    it('should throw a NotFoundException if user to update is not found', async () => {
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

      const updateUserDto: UpdateUserDto = {
        email: 'test@codefactory.ai',
        password: '123123',
      };

      // NotFoundException 테스트
      expect(userService.update(999, updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 999,
        },
      });
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });
  });

  // findAll Test
  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [
        {
          id: 1,
          email: 'test@test.com',
        },
      ];

      // 프로미스가 성공적으로 완료되도록 설정하는 Jest 메서드
      // mock Repository.find 의 결과는 users -> 실제 DB에 접근하는 대신 users를 반환하도록함.
      mockUserRepository.find.mockResolvedValue(users);

      // userService.findAll() => mock Repository.find
      const result = await userService.findAll();

      expect(result).toEqual(users);
      expect(mockUserRepository.find).toHaveBeenCalled(); // mockUserRepository.find 호출 되었는지 확인
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const user = {
        id: 1,
        email: 'test@test.com',
      };

      // mockUserRepository.findOn의 결과는 user
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(user);

      const result = await userService.findOne(1);

      expect(result).toEqual(user);
      // mockUserRepository.findOne의 id가 1로 호출 되었는지 확인
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });
    });

    it('should throw NotFoundException if user is not found ', async () => {
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

      expect(userService.findOne(999)).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 999,
        },
      });
    });
  });

  describe('remove', () => {
    it('should delete a user by id', async () => {
      const id = 999;

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue({
        id: 1,
      });

      // .remove()의 return = id
      const result = await userService.remove(id);

      expect(result).toEqual(id);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          id,
        },
      });
    });

    it('should throw a NotFoundException if user to delete not found', () => {
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

      expect(userService.remove(999)).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 999,
        },
      });
    });
  });
});
