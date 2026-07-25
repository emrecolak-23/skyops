import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceLog } from './entities/maintenance-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MaintenanceLog])],
})
export class MaintenanceModule {}
