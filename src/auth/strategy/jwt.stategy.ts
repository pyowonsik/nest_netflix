import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Bearer $token 자동 검증
      ignoreExpiration: false, // 만료 무시 false
      secretOrKey: configService.get<string>('ACCESS_TOKEN_SECRET'),
    });
  }

  /**
   * Local Strategy
   *
   * paylaod : accessToken ?
   *
   * return -> Request();
   */

  async validate(payload: any) {
    return payload;
  }
}
