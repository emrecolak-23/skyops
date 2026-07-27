import { NestFactory } from '@nestjs/core';
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

  app.enableShutdownHooks();

  app.enableCors({ origin: true });

  const port = config.getOrThrow('app.port', { infer: true });
  await app.listen(port);
}
void bootstrap();
