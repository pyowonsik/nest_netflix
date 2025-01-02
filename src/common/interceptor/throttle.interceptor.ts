import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { catchError, Observable, pipe, tap } from 'rxjs';
import { Throttle } from '../decorator/throttle.decorator';

@Injectable()
export class TrottleInterceptor implements NestInterceptor {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly reflector: Reflector,
    // endpoint(contoller)에서 throttleDecorator의 값을 받기 위함
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    const userId = request?.user?.sub;

    if (!userId) {
      return next.handle(); // 해당 인터셉터 통과
    }

    const thottleOptions = this.reflector.get<{
      count: number;
      unit: 'minute';
    }>(Throttle, context.getHandler());

    if (!thottleOptions) {
      return next.handle(); // 해당 인터셉터 통과
    }

    const date = new Date().getMinutes();

    const key = `${request.method}_${request.path}_${userId}_${date}`;

    const count = await this.cacheManager.get<number>(key);

    console.log(key);
    console.log(count);

    if (count && count >= thottleOptions.count) {
      throw new ForbiddenException('분당 요청 가능 횟수를 넘겼습니다.');
    }

    return next.handle().pipe(
      tap(async () => {
        const count = (await this.cacheManager.get<number>(key)) ?? 0;
        await this.cacheManager.set(key, count + 1, 60000);
      }),
    );
  }
}
