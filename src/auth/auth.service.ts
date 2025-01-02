import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role, User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { envVariableKeys } from 'src/common/const/env.const';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  // rawToken = 'Basic $token(emial:password -> encoding)'
  parserBasicToken(rawToken: string) {
    // ['Basic','$token']
    const basicSplit = rawToken.split(' ');

    if (basicSplit.length != 2) {
      throw new BadRequestException('잘못된 형식의 토큰입니다.');
    }

    const [basic, token] = basicSplit;

    if (basic.toLocaleLowerCase() !== 'basic') {
      throw new BadRequestException('잘못된 형식의 토큰입니다.');
    }

    // 추출한 토큰을 base64 디코딩 'email:password'
    const decoded = Buffer.from(token, 'base64').toString('utf-8');

    // email:password 를  ':' 기준으로 split
    const tokenSplit = decoded.split(':');

    // [email,password]
    if (tokenSplit.length != 2) {
      throw new BadRequestException('잘못된 형식의 토큰입니다.');
    }

    const [email, password] = tokenSplit;
    return { email, password };
  }

  // ${Bearer token} -> Bearer 토큰 분리해서 검증후 payload 반환
  async parserBearerToken(rawToken: string, isRefresh: boolean) {
    // (1) Bearer 토큰 분리
    const basicSplit = rawToken.split(' ');

    if (basicSplit.length != 2) {
      throw new UnauthorizedException('잘못된 형식의 토큰입니다.');
    }
    const [bearer, token] = basicSplit;

    if (bearer.toLocaleLowerCase() !== 'bearer') {
      throw new UnauthorizedException('잘못된 형식의 토큰입니다.');
    }
    try {
      // (2) 디코딩 + 토큰 검증후 payload 반환
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(
          isRefresh
            ? envVariableKeys.refreshTokenSecret
            : envVariableKeys.accessTokenSecret,
        ),
      });

      if (isRefresh) {
        if (payload.type !== 'refresh') {
          throw new BadRequestException('Refresh 토큰을 입력해주세요.');
        }
      } else {
        if (payload.type !== 'access') {
          throw new BadRequestException('Access 토큰을 입력해주세요.');
        }
      }

      return payload;
    } catch {
      throw new BadRequestException('토큰이 만료 되었습니다.');
    }
  }

  async register(rawToken: string) {
    // @Headers에서 넘어온 rawToken(Basic $token)에서 email,password 추출
    const { email, password } = this.parserBasicToken(rawToken);

    const user = await this.userRepository.findOne({
      where: {
        email,
      },
    });

    if (user) {
      throw new BadRequestException('이미 가입한 이메일 입니다.');
    }

    // 환경변수(.env) HASH_ROUNDS 값 저장
    const hashRounds = this.configService.get<number>(
      envVariableKeys.hashRounds,
    );

    // password 암호화
    const hash = await bcrypt.hash(password, hashRounds);

    await this.userRepository.save({
      email,
      password: hash,
    });

    return await this.userRepository.find({
      where: {
        email,
      },
    });
  }

  async authenticate(email: string, password: string) {
    // email 인증
    const user = await this.userRepository.findOne({
      where: {
        email,
      },
    });

    if (!user) {
      throw new BadRequestException('잘못된 로그인 정보입니다.');
    }

    // 비밀번호 인증
    const passOk = bcrypt.compare(password, user.password);

    if (!passOk) {
      throw new BadRequestException('잘못된 로그인 정보입니다.');
    }

    return user;
  }

  // user 정보를 통해 accessToken , refreshToken 발급
  async issueToken(user: { id: number; role: Role }, isRefresh: boolean) {
    // 환경변수(.env) ACCESS_TOKEN_SECRET,REFRESH_TOKEN_SECRET 저장
    const accessTokenSecret = this.configService.get<string>(
      envVariableKeys.accessTokenSecret,
    );
    const refreshTokenSecret = this.configService.get<string>(
      envVariableKeys.refreshTokenSecret,
    );

    return await this.jwtService.signAsync(
      {
        sub: user.id,
        role: user.role,
        type: isRefresh ? 'refresh' : 'access',
      },
      {
        secret: isRefresh ? refreshTokenSecret : accessTokenSecret,
        expiresIn: isRefresh ? '24h' : 300,
      },
    );
  }

  async login(rawToken: string) {
    // @Headers에서 넘어온 rawToken(Basic $token)에서 email,password 추출
    const { email, password } = this.parserBasicToken(rawToken);

    // user 인증
    const user = await this.authenticate(email, password);

    // 로그인 정보가 인증이 되면(로그인 성공시) accessToken,refreshToken 발급
    return {
      accessToken: await this.issueToken(user, false),
      refreshToken: await this.issueToken(user, true),
    };
  }

  async tokenBlock(token: string) {
    const payload = this.jwtService.decode(token);

    // payload가 처음 검증이 되면, payload가 만료되는 시간까지
    // cacheManager에 payload set
    const expiryDate = +new Date(payload['exp'] * 1000);
    const now = +Date.now();

    const differenceInSeconds = (expiryDate - now) / 1000;

    // block 하려는 토큰을 cacheManager에 저장
    await this.cacheManager.set(
      `BLOCK_${token}`,
      payload,
      Math.max(differenceInSeconds * 1000, 1),
    );
    //
    return true;
  }
}
