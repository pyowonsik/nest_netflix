import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CommonService } from './common.service';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Controller('common')
@ApiTags('common')
@ApiBearerAuth()
export class CommonController {
  constructor(
    private readonly commonService: CommonService,
    @InjectQueue('thumbnail-generation')
    private readonly thumbnailQueue: Queue,
  ) {}

  // 파일 선업로드 방식 : 프론트엔드에서 업로드할 파일을 선택할때 movie가 아닌 temp 폴더로 파일을 미리 올려두고,
  // 확실하게 저장을 하게 된다면 선업로드된 temp 폴더에서 movie 폴더로 이동만 하면 되도록 하는 방식.
  @Post('video')
  @UseInterceptors(
    FileInterceptor('video', {
      // 파일 사이즈 제한
      limits: {
        fileSize: 20000000,
      },
      fileFilter(req, file, callback) {
        if (file.mimetype !== 'video/mp4') {
          return callback(
            new BadRequestException('mp4 타입만 업로드 가능합니다.'),
            false,
          );
        }
        return callback(null, true);
      },
    }),
  )
  async createVideo(
    @UploadedFile()
    movie: Express.Multer.File,
  ) {
    await this.thumbnailQueue.add(
      'thumbnail',
      {
        videoId: movie.filename,
        videoPath: movie.path,
      },
      {
        priority: 123, // 큐 우선 순위
        delay: 100,
        attempts: 3,
        lifo: true,
        removeOnComplete: true,
        removeOnFail: true,
      },
    );

    return {
      fileName: movie.filename,
    };
  }

  @Post('presigned-url')
  async cratePresignedUrl() {
    return {
      url: await this.commonService.createPresignedUrl(),
    };
  }
}
