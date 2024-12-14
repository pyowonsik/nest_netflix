import { Injectable } from '@nestjs/common';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

export class LocalAuthGaurd extends AuthGuard('codefactory') {}

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'codefactory') {
  constructor(private readonly authServie: AuthService) {
    super({
      usernameField: 'email', // username -> email
    });
  }

  /**
   * Local Strategy
   *
   * validate : username,password
   *
   * return -> Request();
   */

  async validate(username: string, password: string) {
    const user = await this.authServie.authenticate(username, password);

    return user;
  }
}
