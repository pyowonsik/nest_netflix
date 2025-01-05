import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
    // { logger: ['debug'] }
  );
  // app.setGlobalPrefix('v1');
  app.enableVersioning({
    type: VersioningType.URI,
    // header : 'version'
  });
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.useGlobalPipes(
    new ValidationPipe({
      // DTO 정의하지 않은 property를 숨김
      whitelist: true,
      // DTO 정의하지 않은 property일때, Error
      forbidNonWhitelisted: true,
      // postMan에서 보내는 데이터 타입 transform
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
