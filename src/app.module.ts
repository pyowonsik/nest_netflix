import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { MovieModule } from './movie/movie.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { Movie } from './movie/entity/movie.entity';
import { MovieDetail } from './movie/entity/movie-detail.entity';
import { DirectorModule } from './director/director.module';
import { Director } from './director/entity/director.entity';
import { GenreModule } from './genre/genre.module';
import { Genre } from './genre/entities/genre.entity';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { User } from './user/entities/user.entity';
import { envVariableKeys } from './common/const/env.const';
import { BearerTokenMiddleWear } from './auth/middlewear/bearer-token.middlewear';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthGuard } from './auth/guard/auth.gaurd';
import { RBACGaurd } from './auth/guard/rbac.gaurd';
import { ResponseTimeInterceptor } from './common/interceptor/response-time.interceptor';
import { ForbiddenExceptionFilter } from './common/filter/forbidden.filter';
import { QueryFailedError } from 'typeorm';
import { QueryFailedExceptionFilter } from './common/filter/query-failed.filter';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MovieUserLike } from './movie/entity/movie-user-like.entity';
import { CacheModule } from '@nestjs/cache-manager';
import { TrottleInterceptor } from './common/interceptor/throttle.interceptor';
import { ScheduleModule } from '@nestjs/schedule';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

@Module({
  imports: [
    // DB 정보 환경 변수 적용
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? 'test.env' : '.env',
      validationSchema: Joi.object({
        ENV: Joi.string().valid('test', 'dev', 'prod').required(),
        DB_TYPE: Joi.string().valid('postgres').required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        HASH_ROUNDS: Joi.number().required(),
        REFRESH_TOKEN_SECRET: Joi.string().required(),
        ACCESS_TOKEN_SECRET: Joi.string().required(),
      }),
    }),
    // TypeORM 적용
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: configService.get<string>(envVariableKeys.dbType) as 'postgres',
        host: configService.get<string>(envVariableKeys.dbHost),
        port: configService.get<number>(envVariableKeys.dbPort),
        username: configService.get<string>(envVariableKeys.dbUsername),
        password: configService.get<string>(envVariableKeys.dbPassword),
        database: configService.get<string>(envVariableKeys.dbDataBase),
        entities: [Movie, MovieDetail, Director, Genre, User, MovieUserLike],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      // public 요청시 반드시 /public/ 붙여서 요청해야함. -> movie/uuid~~ 로 요청하게 되면 url이 겹치기 때문에 public/movie/uuid ~~ 로 요청하도록 하기 위함
      serveRoot: '/public/',
    }),
    CacheModule.register({
      ttl: 0,
      isGlobal: true,
    }),
    // CacheModule.registerAsync({
    //   isGlobal: true,
    //   useFactory: async () => ({
    //     store: redisStore as unknown as string, // Redis Store 설정
    //     host: 'localhost',
    //     port: 6379,
    //     ttl: 0,
    //     // username: configService.get<string>('REDIS_USERNAME'), // Redis 사용자 (선택)
    //     // password: configService.get<string>('REDIS_PASSWORD'), // Redis 비밀번호 (선택)
    //   }),
    // }),
    WinstonModule.forRoot({
      level: 'debug',
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize({
              all: true,
            }),
            winston.format.timestamp(),
            winston.format.printf(
              (info) =>
                `${info.timestamp} [${info.context}] ${info.level} ${info.message}`,
            ),
          ),
        }),
        new winston.transports.File({
          dirname: join(process.cwd(), 'logs'),
          filename: 'logs.log',
          format: winston.format.combine(
            // winston.format.colorize({
            //   all: true,
            // }),
            winston.format.timestamp(),
            winston.format.printf(
              (info) =>
                `${info.timestamp} [${info.context}] ${info.level} ${info.message}`,
            ),
          ),
        }),
      ],
    }),
    ScheduleModule.forRoot(),
    MovieModule,
    DirectorModule,
    GenreModule,
    UserModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RBACGaurd,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTimeInterceptor,
    },
    // {
    //   provide: APP_FILTER,
    //   useClass: ForbiddenExceptionFilter,
    // },
    {
      provide: APP_FILTER,
      useClass: QueryFailedExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TrottleInterceptor,
    },
  ],
})

// MiddleWear 적용
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(BearerTokenMiddleWear)
      .exclude(
        {
          path: 'auth/login',
          method: RequestMethod.POST,
        },
        {
          path: 'auth/register',
          method: RequestMethod.POST,
        },
      )
      .forRoutes('*');
  }
}
