import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mission } from './entities/mission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Mission])],
})
export class MissionsModule {}
