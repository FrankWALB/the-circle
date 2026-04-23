import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }),
  );

  const allowedOrigin = process.env.CORS_ORIGIN ?? '*';
  app.enableCors({
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'x-user-id', 'x-user-role'],
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Backend running on port ${port} (CORS origin: ${allowedOrigin})`);
}

bootstrap();
