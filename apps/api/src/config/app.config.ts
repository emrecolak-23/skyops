import { registerAs } from '@nestjs/config';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { validateConfig } from 'src/utils/validate-config.util';

export enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export type AppConfig = {
  nodeEnv: NodeEnv;
  port: number;
  apiPrefix: string;
};

class AppEnvValidator {
  @IsEnum(NodeEnv)
  @IsOptional()
  NODE_ENV?: NodeEnv;

  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  PORT?: number;

  @IsString()
  @IsOptional()
  API_PREFIX?: string;
}

export default registerAs<AppConfig>('app', () => {
  validateConfig(process.env, AppEnvValidator);
  return {
    nodeEnv: (process.env.NODE_ENV as NodeEnv) ?? NodeEnv.Development,
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
    apiPrefix: process.env.API_PREFIX ?? 'api',
  };
});
