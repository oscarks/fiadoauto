import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

const DEFAULT_CORS_ORIGINS = [
  'http://localhost:5000',
  'http://localhost:5001',
  'http://localhost:5002',
  'http://localhost:5003',
];

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  return value.toLowerCase() === 'true';
}

function parseCorsOrigins(value: string | undefined): string[] {
  if (!value) {
    return DEFAULT_CORS_ORIGINS;
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const corsEnabled = parseBoolean(config.get<string>('CORS_ENABLED'), true);

  if (corsEnabled) {
    const allowedOrigins = parseCorsOrigins(
      config.get<string>('CORS_ALLOWED_ORIGINS'),
    );

    app.enableCors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
      },
      credentials: parseBoolean(
        config.get<string>('CORS_ALLOW_CREDENTIALS'),
        true,
      ),
    });
  }

  app.setGlobalPrefix('');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 5100);
}

bootstrap();
