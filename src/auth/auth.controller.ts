import {
  Controller,
  Get,
  Header,
  Headers,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { LocalAuthGaurd } from './strategy/local.strategy';
import { JwtAuthGuard, JwtStrategy } from './strategy/jwt.stategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // authorization
  // 회원가입,로그인(access,refresh 발급) : Basic $token
  // accessToken , refreshToken 사용시 : Bearer $accessToken / $refreshToken

  @Post('register')
  // authorization : Basic $token(emial:password -> encoding)
  registerUser(@Headers('authorization') token: string) {
    return this.authService.register(token);
  }

  @Post('login')
  // authorization : Basic $token(emial:password -> encoding)
  loginUser(@Headers('authorization') token: string) {
    return this.authService.login(token);
  }

  // Guard를 통과하면 req 반환

  // AuthGuard -> Local Strategy
  // @UseGuards(AuthGuard('codefactory'))
  @UseGuards(LocalAuthGaurd) // string값 오타 방지를 위해 , LocalAuthGaurd 적용
  @Post('login/passport')
  async loginUserPassport(@Request() req) {
    // local strategy에서 반환된 user 정보를 통해 accessToken , refreshToken 발급
    return {
      accessToken: await this.authService.issueToken(req.user, false),
      refreshToken: await this.authService.issueToken(req.user, true),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('private')
  async private(@Request() req) {
    return req.user;
  }

  @Post('token/access')
  async rotateAccessToken(@Headers('authorization') token: string) {
    // ${Bearer token} -> Bearer 토큰 분리해서 검증후 payload 반환
    const paylaod = await this.authService.parserBeareToken(token, true);

    // payload(user 정보)를 통해 accessToken 재발급
    return {
      accessToken: await this.authService.issueToken(paylaod, false),
    };
  }
}
