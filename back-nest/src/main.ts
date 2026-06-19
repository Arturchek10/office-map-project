import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { types } from 'pg';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';

types.setTypeParser(20, (value: string) => Number(value));

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Disposition'],
  });

  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
        exposeUnsetFields: false,
      },
      exceptionFactory: (errors) =>
        new BadRequestException({
          message: 'Validation failed',
          subErrors: errors.flatMap((error) =>
            Object.values(error.constraints ?? {}).map((message) => ({
              object: error.target?.constructor?.name ?? 'Request',
              field: error.property,
              rejectedValue: error.value,
              message,
            })),
          ),
        }),
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Office Map API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  await app.listen(8080);
}

void bootstrap();
