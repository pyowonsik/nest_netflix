import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';

export const WsQueryRunner = createParamDecorator(
  (data: any, context: ExecutionContext) => {
    const client = context.switchToWs().getClient();

    // !request.queryRunner == TransactionInterceptor를 적용하지 않았다.
    if (!client || !client.data || !client.data.queryRunner) {
      throw new InternalServerErrorException('');
    }
    return client.data.queryRunner;
  },
);
