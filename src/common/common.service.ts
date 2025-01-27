import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { PagePaginationDto } from './dto/page-pagination.dto';
import { CursorPaginaitionDto } from './dto/cursor-pagination.dto';
import * as AWS from 'aws-sdk';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ObjectCannedACL, PutObjectCommand, S3 } from '@aws-sdk/client-s3';
import { v4 as Uuid } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { envVariableKeys } from './const/env.const';

@Injectable()
export class CommonService {
  private s3: S3;

  constructor(private readonly configService: ConfigService) {
    // // JS SDK v3 does not support global configuration.
    // // Codemod has attempted to pass values to each service client in this file.
    // // You may need to update clients outside of this file, if they use global config.
    // AWS.config.update({
    //   credentials: {
    //     accessKeyId: configService.get<string>(envVariableKeys.awsAccessKeyId),
    //     secretAccessKey: configService.get<string>(
    //       envVariableKeys.awsSecretAccessKey,
    //     ),
    //   },
    //   region: configService.get<string>(envVariableKeys.awsRegion),
    // });

    this.s3 = new S3({
      credentials: {
        accessKeyId: configService.get<string>(envVariableKeys.awsAccessKeyId),
        secretAccessKey: configService.get<string>(
          envVariableKeys.awsSecretAccessKey,
        ),
      },

      region: configService.get<string>(envVariableKeys.awsRegion),
    });
  }

  async saveMovieToPermanentStorage(filename: string) {
    try {
      const bucketName = this.configService.get<string>(
        envVariableKeys.bucketName,
      );
      await this.s3.copyObject({
        Bucket: bucketName,
        CopySource: `${bucketName}/public/temp/${filename}`,
        Key: `public/movie/${filename}`,
        ACL: 'public-read',
      });
      await this.s3.deleteObject({
        Bucket: bucketName,
        Key: `public/temp/${filename},`,
      });
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException('S3 에러!');
    }
  }

  async createPresignedUrl(expiresIn = 300) {
    const params = {
      Bucket: this.configService.get<string>(envVariableKeys.bucketName),
      Key: `public/temp/${Uuid()}.mp4`,
      ACL: ObjectCannedACL.public_read,
    };
    try {
      const url = await getSignedUrl(this.s3, new PutObjectCommand(params), {
        expiresIn,
      });
      return url;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('S3 Presigned URL 생성 실패');
    }
  }

  applyPagePaginationParamsToQb<T>(
    qb: SelectQueryBuilder<T>,
    dto: PagePaginationDto,
  ) {
    const { take, page } = dto;
    const skip = (page - 1) * take;

    // 3,2  -> (4,5,6) , 1페이지(1,2,3) 스킵
    qb.take(take);
    qb.skip(skip);
  }

  async applyCursorPaginationParamsToQb<T>(
    qb: SelectQueryBuilder<T>,
    dto: CursorPaginaitionDto,
  ) {
    let { cursor, order, take } = dto;

    /**
     * {
     *  values : {
     *        likeCount : 20,
     *        id : 35
     *   },
     *  order : ['likeCount_DESC','id_DESC'],
     * }
     */
    // cursor가 있다면 마지막의 cursor를 기반으로 order를 만들어 사용
    if (cursor) {
      const decodedCursor = Buffer.from(cursor, 'base64').toString('utf-8');

      const cursorObj = JSON.parse(decodedCursor);

      // 실수로 order,cursor를 같이 Dto로 던지더라도 generateCursor에서 만든 order로 사용.
      order = cursorObj.order;

      const { values } = cursorObj;

      // query : WHERE ("likeCount", "id") < (20 , 35)
      // (movie.column1,movie.column2,movie.colum3) > (:value1,:value2,:value3)
      const columns = Object.keys(values);
      const comparisonOperator = order.some((o) => o.endsWith('DESC'))
        ? '<'
        : '>';
      const whereConditions = columns.map((c) => `${qb.alias}.${c}`).join(',');
      const whereParams = columns.map((c) => `:${c}`).join(',');

      qb.where(
        `(${whereConditions}) ${comparisonOperator} (${whereParams})`,
        values,
      );
    }

    // order = [likeCount_DESC,id_DESC]
    for (let i = 0; i < order.length; i++) {
      const [column, direction] = order[i].split('_');

      if (direction !== 'ASC' && direction !== 'DESC') {
        throw new BadRequestException('order는 ASC 또는 DESC로 입력해주세요.');
      }

      // SELECT id,"likeCount" FROM movie
      // ORDER BY "likeCount" DESC, id DESC
      if (i === 0) {
        // likeCount_DESC
        qb.orderBy(`${qb.alias}.${column}`, direction);
      } else {
        // id_DESC
        qb.addOrderBy(`${qb.alias}.${column}`, direction);
      }
    }

    qb.take(take);

    const results = await qb.getMany();

    const nextCursor = this.generateNextCursor(results, order);

    return { qb, nextCursor };
  }

  generateNextCursor<T>(results: T[], order: string[]): string | null {
    if (results.length === 0) {
      return null;
    }

    /**
     * {
     *  values : {
     *        likeCount : 20,
     *        id : 35
     *   },
     *  order : ['likeCount_DESC','id_DESC'],
     * }
     */

    // cursor를 만들어야함 cursor = id_52 or likeCount_20

    // results = qb.take(5)
    // results = [movie[39],movie[38],movie[37],movie[36],movie[35]]
    // movie[35] = {
    //  ``
    //  id : 35,
    //  likeCount : 20,
    //  ``
    //  ``
    // }
    const lastItem = results[results.length - 1];

    const values = {};

    order.forEach((columnOrder) => {
      const [column] = columnOrder.split('_');
      values[column] = lastItem[column];
    });

    // values : {
    //  id : 35,
    //  likeCount : 20
    // }

    const cursorObj = { values, order };

    const nextCursor = Buffer.from(JSON.stringify(cursorObj)).toString(
      'base64',
    );

    return nextCursor;
  }
}
