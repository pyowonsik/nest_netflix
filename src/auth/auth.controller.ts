import {
  Controller,
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

  // AuthGuard -> Local Strategy
  // @UseGuards(AuthGuard('codefactory'))
  @UseGuards(LocalAuthGaurd) // string값 오타 방지를 위해 , LocalAuthGaurd 적용
  @Post('login/passport')
  loginUserPassport(@Request() req) {
    return req.user;
  }
}
