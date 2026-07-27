import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from 'src/database/typeorm.config';
import { AllConfigType } from 'src/config/config.type';
import { join } from 'path';
import { NodeEnv } from 'src/config/app.config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AllConfigType>) => ({
        ...dataSourceOptions,
        url: config.getOrThrow('database.url', { infer: true }),
        migrations: [join(__dirname, 'migrations', '*.js')],
        migrationsRun:
          config.get('app.nodeEnv', { infer: true }) === NodeEnv.Production,
      }),
    }),
  ],
})
export class DatabaseModule {}
