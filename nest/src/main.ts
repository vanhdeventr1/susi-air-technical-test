import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './cores/filters/api-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3002',
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'OPTIONS'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap().catch((error: unknown) => {
  console.error('Failed to start application:', error);
  process.exitCode = 1;
});
