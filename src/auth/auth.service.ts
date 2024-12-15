import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  // rawToken = 'Basic $token(emial:password -> encoding)'
  parserBasicToken(rawToken: string) {
    // ['Basic','$token']
    const basicSplit = rawToken.split(' ');

    if (basicSplit.length != 2) {
      throw new BadRequestException('잘못된 형식의 토큰입니다.');
    }
    const [_, token] = basicSplit;

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
    const hashRounds = this.configService.get<number>('HASH_ROUNDS');

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
  async issueToken(user: User, isRefresh: boolean) {
    // 환경변수(.env) ACCESS_TOKEN_SECRET,REFRESH_TOKEN_SECRET 저장
    const accessTokenSecret = this.configService.get<string>(
      'ACCESS_TOKEN_SECRET',
    );
    const refreshTokenSecret = this.configService.get<string>(
      'REFRESH_TOKEN_SECRET',
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
}
