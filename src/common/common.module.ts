import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { CommonController } from './common.controller';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { v4 } from 'uuid';
import { TasksService } from './tasks.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from 'src/movie/entity/movie.entity';
import { DefaultLogger } from 'src/movie/entity/default.logger';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    // 파일 저장소 지정
    // process.cwd : 현재 프로젝트의 최상단 경로
    MulterModule.register({
      storage: diskStorage({
        // ..../NETFLIX/public/movie
        destination: join(process.cwd(), 'public', 'temp'),
        filename: (req, file, cb) => {
          const split = file.originalname.split('.');

          let extension = 'mp4';

          // 확장자가 있다면 ?
          if (split.length > 1) {
            extension = split[split.length - 1];
          }

          cb(null, `${v4()}_${Date.now()}.${extension}`);
        },
      }),
    }),
    TypeOrmModule.forFeature([Movie]),
    // redis + 큐 적용
    BullModule.forRoot({
      connection: {
        host: 'redis-19242.c340.ap-northeast-2-1.ec2.redns.redis-cloud.com',
        port: 19242,
        username: 'default',
        password: '3mGBsgrV6KlnRIBNRCzeC4r5BHss89Xx',
      },
    }),
    BullModule.registerQueue({
      name: 'thumbnail-generation',
    }),
  ],
  controllers: [CommonController],
  providers: [CommonService, TasksService, DefaultLogger],
  exports: [CommonService, DefaultLogger],
})
export class CommonModule {}
