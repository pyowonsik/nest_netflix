import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './entity/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { use } from 'passport';
// 의존성 mock
const mockedUserService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};
describe('UserController', () => {
  let userContoller: UserController;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockedUserService,
        },
      ],
    }).compile();
    userContoller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(userContoller).toBeDefined();
  });

  describe('create', () => {
    it('should return correct value', async () => {
      const createUserDto = {
        email: 'test@codefactory.ai',
        password: '12341234',
      };

      const user = {
        id: 1,
        ...createUserDto,
        password: 'asdjnonsao',
      };

      jest.spyOn(mockedUserService, 'create').mockResolvedValue(user as User);

      const result = await userContoller.create(createUserDto);
      // userService.create는 createUserDto를 파라미터로 호출
      expect(userService.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(user);
    });
  });

  describe('findAll', () => {
    it('should return a list of users', async () => {
      const users = [
        {
          id: 1,
          email: 'test1@codefactory.ai',
        },
        {
          id: 2,
          email: 'test2@codefactory.ai',
        },
      ];

      jest
        .spyOn(mockedUserService, 'findAll')
        .mockResolvedValue(users as User[]);

      const result = await userContoller.findAll();
      // userService.create는 createUserDto를 파라미터로 호출
      expect(userService.findAll).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe('findOne', () => {
    it('should return a single user', async () => {
      const id = 1;
      const user = {
        id: 1,
        email: 'test1@codefactory.ai',
      };

      jest.spyOn(mockedUserService, 'findOne').mockResolvedValue(user as User);

      const result = await userContoller.findOne(id);
      expect(userService.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(user);
    });
  });

  describe('update', () => {
    it('should return the updated user', async () => {
      const id = 1;
      const updateUserDto: UpdateUserDto = {
        email: 'test@codefactory.ai',
      };

      const user = {
        id,
        ...updateUserDto,
      };

      jest.spyOn(mockedUserService, 'update').mockResolvedValue(user as User);

      const result = await userContoller.update(id, updateUserDto);
      expect(userService.update).toHaveBeenCalledWith(id, updateUserDto);
      expect(result).toEqual(user);
    });
  });

  describe('remove', () => {
    it('should return the deleted userId', async () => {
      const id = 1;

      jest.spyOn(mockedUserService, 'remove').mockResolvedValue(id);

      const result = await userContoller.remove(id);
      expect(userService.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(id);
    });
  });
});
