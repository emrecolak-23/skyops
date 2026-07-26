import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from 'src/app.module';
import { DomainExceptionFilter } from 'src/common/filters/domain-exception.filter';
import { dataSourceOptions } from 'src/database/typeorm.config';

export interface IntegrationContext {
  app: INestApplication;
  dataSource: DataSource;
  container: StartedPostgreSqlContainer;
}

export async function setupIntegration(): Promise<IntegrationContext> {
  const container = await new PostgreSqlContainer('postgres:16')
    .withDatabase('skyops_test')
    .withUsername('skyops')
    .withPassword('skyops')
    .start();

  const url = container.getConnectionUri();
  process.env.DATABASE_URL = url;

  const migrationDataSource = new DataSource({
    ...dataSourceOptions,
    url,
    migrations: ['src/database/migrations/*.ts'],
  } as DataSource['options']);
  await migrationDataSource.initialize();
  await migrationDataSource.runMigrations();
  await migrationDataSource.destroy();

  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new DomainExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  await app.init();

  const dataSource = app.get(DataSource);
  return { app, dataSource, container };
}

export async function teardownIntegration(
  ctx: IntegrationContext,
): Promise<void> {
  await ctx.app.close();
  await ctx.container.stop();
}
