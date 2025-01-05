import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
    // { logger: ['debug'] }
  );

  // app.setGlobalPrefix('v1');
  // app.enableVersioning({
  //   type: VersioningType.URI,
  // });

  // swagger doc 셋팅
  //
  const config = new DocumentBuilder()
    .setTitle('코드팩토리 넷플릭스')
    .setDescription('코드팩토리 NEST JS 강의')
    .setVersion('1.0')
    .addBasicAuth()
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('doc', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // swagger 인증 정보 저장
    },
  });
  //

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
