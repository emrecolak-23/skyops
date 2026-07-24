import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Drone } from './entities/drone.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Drone])],
})
export class DronesModule {}
