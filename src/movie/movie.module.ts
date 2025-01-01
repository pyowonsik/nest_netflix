import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from './entity/movie.entity';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entities/genre.entity';
import { CommonModule } from 'src/common/common.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { v4 } from 'uuid';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [
    CommonModule,
    // // 파일 저장소 지정
    // // process.cwd : 현재 프로젝트의 최상단 경로
    // MulterModule.register({
    //   storage: diskStorage({
    //     // ..../NETFLIX/public/movie
    //     destination: join(process.cwd(), 'public', 'movie'),
    //     filename: (req, file, cb) => {
    //       const split = file.originalname.split('.');

    //       let extension = 'mp4';

    //       // 확장자가 있다면 ?
    //       if (split.length > 1) {
    //         extension = split[split.length - 1];
    //       }

    //       cb(null, `${v4()}_${Date.now()}.${extension}`);
    //     },
    //   }),
    // }),
    TypeOrmModule.forFeature([
      Movie,
      MovieDetail,
      Director,
      Genre,
      User,
      MovieUserLike,
    ]),
  ], // typeorm movie repository
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
