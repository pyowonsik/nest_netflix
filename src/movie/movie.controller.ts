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

@Controller('movie')
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
  getMovies(@Query() dto: GetMovieDto) {
    return this.movieService.findAll(dto);
  }

  @Public()
  @Get(':id')
  getMovie(@Param('id', ParseIntPipe) id: number) {
    return this.movieService.findOne(id);
  }

  @RBAC(Role.admin)
  @Post()
  postMoive(@Body() body: CreateMovieDto) {
    return this.movieService.create(body);
  }

  @RBAC(Role.admin)
  @Put(':id')
  putMovie(
    @Param('id', ParseIntPipe) id: string,
    @Body() body: UpdateMovieDto,
  ) {
    return this.movieService.update(+id, body);
  }

  @RBAC(Role.admin)
  @Delete(':id')
  deleteMovie(@Param('id', ParseIntPipe) id: string) {
    return this.movieService.delete(+id);
  }
}
