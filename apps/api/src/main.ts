import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllConfigType } from './config/config.type';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DomainExceptionFilter } from './common/filters/domain-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get<ConfigService<AllConfigType>>(ConfigService);
  app.setGlobalPrefix(config.getOrThrow('app.apiPrefix', { infer: true }));
  app.useGlobalFilters(new DomainExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.use(helmet());
  app.enableShutdownHooks();

  const corsOrigin =
    process.env.NODE_ENV === 'production'
      ? (process.env.CORS_ORIGIN?.split(',') ?? false)
      : ['http://localhost:3000'];

  app.enableCors({ origin: corsOrigin });
  const port = config.getOrThrow('app.port', { infer: true });
  await app.listen(port);
}
void bootstrap();
