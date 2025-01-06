import {
  Body,
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
import { Public } from './decorator/public.decorator';
import { ApiBasicAuth, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Authorization } from './decorator/authorization.decorator';

@Controller('auth')
@ApiTags('auth')
@ApiBearerAuth()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // authorization
  // 회원가입,로그인(access,refresh 발급) : Basic $token
  // accessToken , refreshToken 사용시 : Bearer $accessToken / $refreshToken

  @Public()
  @Post('register')
  @ApiBasicAuth()
  registerUser(@Authorization() token: string) {
    return this.authService.register(token);
  }

  @Public()
  @Post('login')
  @ApiBasicAuth()
  loginUser(
    @Authorization() token: string,
    // Swagger에서 인식하지 못하도록 custom decorator 사용.
    // 해당 데코레이터를 사용하면 자동으로 authorization을 header로 넣어줌 -> 스웨거에서 authorization 입력을 할 필요 없음
    // @Headers('authorization') token: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.login(token);
  }

  @Post('token/block')
  blockToken(@Body('token') token: string) {
    return this.authService.tokenBlock(token);
  }

  // Guard를 통과하면 req 반환

  // Strategy는 요청이 들어오면 응답을 보내기 전에 인증 및 검증 작업을 수행하는 Guard의 역할을 한다.
  // LocalStrategy의 경우, 사용자 정보(email과 password)를 검증하여 유효한 경우 해당 **user 객체**를 반환한다.
  // 반환된 user 객체는 요청 객체(req.user)에 저장되며, 이를 기반으로 JWT 토큰을 발급하거나 추가 인증 로직을 처리할 수 있다.

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

  // JwtStrategy의 경우, accessToken을 검증하여 유효한 경우 해당 payload를 반환한다.
  // Bearer $token 으로 요청을 보내면 자동으로 토큰값 분리해서 검증 가능.
  @UseGuards(JwtAuthGuard)
  @Get('private')
  async private(@Request() req) {
    return req.user;
  }

  @Post('token/access')
  async rotateAccessToken(
    @Request() req: any,
    // @Headers('authorization') token: string,
  ) {
    // refresh token을 사용하여 -> access token을 재발급 받기 위한 로직
    // Headers : bearer ${refresh token}
    // pareserBearToken : refresh token 분리후 (디코딩 + 유효한 토큰 인지 검증) payload(user) 반환
    // issueToken : payload(user) + secret 값을 이용하여 토큰 재발급

    // ${Bearer token} -> Bearer 토큰 분리해서 검증후 payload 반환
    // const paylaod = await this.authService.parserBearerToken(token, true);

    // payload(user 정보)를 통해 accessToken 재발급

    // BearerTokenMiddleWear를 통해 req.user를 반환받아 user정보로 payload를 대체하여 issueToken
    return {
      accessToken: await this.authService.issueToken(req.user, false),
    };
  }
}
