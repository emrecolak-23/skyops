import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from 'src/config/type.orm.config';
import { AllConfigType } from 'src/config/config.type';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AllConfigType>) => ({
        ...dataSourceOptions,
        url: config.getOrThrow('database.url', { infer: true }),
      }),
    }),
  ],
})
export class DatabaseModule {}
