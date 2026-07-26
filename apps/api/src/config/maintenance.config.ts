export type MaintenanceConfig = {
  intervalDays: number;
  intervalFlightHours: number;
  toleranceHours: number;
};

import { registerAs } from '@nestjs/config';
import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import { validateConfig } from 'src/utils/validate-config.util';

class MaintenanceEnvValidator {
  @IsInt()
  @Min(1)
  @IsOptional()
  MAINTENANCE_INTERVAL_DAYS?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  MAINTENANCE_INTERVAL_FLIGHT_HOURS?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  MAINTENANCE_TOLERANCE_HOURS?: number;
}

export default registerAs<MaintenanceConfig>('maintenance', () => {
  validateConfig(process.env, MaintenanceEnvValidator);
  return {
    intervalDays: process.env.MAINTENANCE_INTERVAL_DAYS
      ? parseInt(process.env.MAINTENANCE_INTERVAL_DAYS, 10)
      : 90,
    intervalFlightHours: process.env.MAINTENANCE_INTERVAL_FLIGHT_HOURS
      ? parseInt(process.env.MAINTENANCE_INTERVAL_FLIGHT_HOURS, 10)
      : 50,
    toleranceHours: process.env.MAINTENANCE_TOLERANCE_HOURS
      ? parseFloat(process.env.MAINTENANCE_TOLERANCE_HOURS)
      : 1.0,
  };
});
