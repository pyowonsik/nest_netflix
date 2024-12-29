import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';

export const QueryRunner = createParamDecorator(
  (data: any, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();

    // !request.queryRunner == TransactionInterceptor를 적용하지 않았다.
    if (!request || !request.queryRunner) {
      throw new InternalServerErrorException('');
    }
    return request.queryRunner;
  },
);
