import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    // DTO 정의하지 않은 property를 숨김
    whitelist : true,
    // DTO 정의하지 않은 property일때, Error
    forbidNonWhitelisted : true
  }))  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
