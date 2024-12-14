import { Controller, Header, Headers, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 회원가입 : Basic $token
  // accessToken , refreshToken 사용시 : Bearer $accessToken / $refreshToken

  // authorization : Basic $token(emial:password -> encoding)
  @Post('register')
  registerUser(@Headers('authorization') token: string) {
    return this.authService.register(token);
  }
}
