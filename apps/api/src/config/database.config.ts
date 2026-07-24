import { registerAs } from '@nestjs/config';
import { IsString } from 'class-validator';
import { validateConfig } from '../utils/validate-config.util';

export type DatabaseConfig = {
  url: string;
};

class DatabaseEnvValidator {
  @IsString()
  DATABASE_URL!: string;
}

export default registerAs<DatabaseConfig>('database', () => {
  validateConfig(process.env, DatabaseEnvValidator);
  return { url: process.env.DATABASE_URL as string };
});
