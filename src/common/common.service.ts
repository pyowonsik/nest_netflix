import { Injectable } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { PagePaginationDto } from './dto/page-pagination.dto';
import { CursorPaginaitionDto } from './dto/cursor-pagination.dto';

@Injectable()
export class CommonService {
  constructor() {}

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

  applyCursorPaginationParamsToQb<T>(
    qb: SelectQueryBuilder<T>,
    dto: CursorPaginaitionDto,
  ) {
    const { order, id, take } = dto;

    if (id) {
      const direction = order === 'ASC' ? '>' : '<';

      // order -> 'ASC'
      // movie.id  > :id (오름차순)

      // order -> 'DESC'
      // movie.id < :id (내림차순)

      qb.where(`${qb.alias}.id ${direction} :id`, { id });
    }

    qb.orderBy(`${qb.alias}.id`, order);

    qb.take(take);
  }
}
