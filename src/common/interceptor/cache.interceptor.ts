import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { response } from 'express';
import { Observable, of, tap } from 'rxjs';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private cache = new Map<string, any>();

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();

    const key = `${req.method}-${req.path}`;

    if (this.cache.has(key)) {
      return of(this.cache.get(key)); // get으로 불러오는 반환값은 key , reponse 형태 -> key값이 존재 한다면 클라이언트로 처음 보낸 응답을 반환한다.
    }

    return next.handle().pipe(tap((response) => this.cache.set(key, response)));
  }
}
