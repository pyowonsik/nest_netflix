import { Controller, Header, Headers, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';

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
}
