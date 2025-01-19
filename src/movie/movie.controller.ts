import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseArrayPipe,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseInterceptors,
  Request,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { time } from 'console';
import { title } from 'process';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { ClassTransformer } from 'class-transformer';
import { number } from 'joi';
import { MovieTitleValidationPipe } from './pipe/movie-title-validation.pipe';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBACGaurd } from 'src/auth/guard/rbac.gaurd';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { Role } from 'src/user/entities/user.entity';
import { GetMovieDto } from './dto/get-movie.dto';
import {
  CacheKey,
  CacheTTL,
  CacheInterceptor as CI,
} from '@nestjs/cache-manager';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import {
  FileFieldsInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { UserId } from 'src/user/decorator/user-id.decorator';
import { QueryRunner as QR } from 'typeorm';
import { QueryRunner } from 'src/common/decorator/query-runner.decorator';
import { Throttle } from 'src/common/decorator/throttle.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@Controller('movie')
@ApiTags('movie')
@ApiBearerAuth()
// class-transform : 변환
// class-transformer 사용 -> ( @Expose , @Exclude , @Transform )
@UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  // Guard를 통과해야 정상 적인 요청 가능
  // Public() 데코레이터는 무조건 Gurad 통과
  // RBACGaurd를 통과하려면 @RBAC() 데코레이터를 통해 role을 받아야함.
  // 현재 AuthGaurd , RBACGaurd는 전역으로 적용 되어 있기 때문에,
  // @Public() 데코레이터가 있거나 , @RBAC(Role.admin) 데코레이터의
  // role 값이 조건을 통과해야함.

  // 사실상 @(데코레이터)는 Gurad를 통과시키는 수단.

  @Public()
  @Get()
  @Throttle({
    count: 5,
    unit: 'minute',
  })
  // ThrottleInterceptor를 적용하려면 Trottle 데코레이터 필요
  //  -> Throttle 데코레이터가 없다면 인터셉텨를 통과 시키기때문
  // @UseInterceptors(CacheInterceptor)
  // @Version('5')
  @ApiOperation({
    description: '[movie]를 Pagination하는 API',
  })
  @ApiResponse({
    status: 200,
    description: 'Pagination 성공',
  })
  @ApiResponse({
    status: 400,
    description: 'Pagination 데이터 잘못 입력',
  })
  getMovies(@Query() dto: GetMovieDto, @UserId() userId?: number) {
    return this.movieService.findAll(dto, userId);
  }

  // /movie/recent?sdfjiv
  // /movie/id에 걸릴수 있으므로 위에 선언
  @Get('recent')
  @UseInterceptors(CI)
  @CacheKey('getMoviesRecent')
  @CacheTTL(1000)
  getMoviesRecent() {
    // console.log('getMovieRecent');
    return this.movieService.findRecent();
  }

  @Public()
  @Get(':id')
  getMovie(@Param('id', ParseIntPipe) id: number) {
    return this.movieService.findOne(id);
  }

  // middleWear - Guard - interceptor

  @RBAC(Role.admin)
  // RBACGaurd(권한처리)를 적용하려면 RBAC 데코레이터 필요
  //  -> RBAC 데코레이터가 없다면 인터셉텨를 통과 시키기때문
  @Post()
  @UseInterceptors(TransactionInterceptor) // queryRunner 반환 인터셉터
  postMoive(
    @Body() body: CreateMovieDto,
    @QueryRunner() queryRunner: QR, // queryRunner 반환 데코레이터
    @UserId() userId: number, // userId 반환 데코레이터
  ) {
    return this.movieService.create(body, userId, queryRunner);
  }

  @RBAC(Role.admin)
  @Patch(':id')
  patchMovie(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateMovieDto,
  ) {
    return this.movieService.update(+id, body);
  }

  @RBAC(Role.admin)
  @Delete(':id')
  deleteMovie(@Param('id', ParseIntPipe) id: number) {
    return this.movieService.delete(+id);
  }

  @Post(':id/like')
  createMovieLike(
    @Param('id', ParseIntPipe) movieId: number,
    @UserId() userId: number,
  ) {
    return this.movieService.toggleMovieLike(movieId, userId, true);
  }

  @Post(':id/dislike')
  createMovieDisLike(
    @Param('id', ParseIntPipe) movieId: number,
    @UserId() userId: number,
  ) {
    return this.movieService.toggleMovieLike(movieId, userId, false);
  }
}
