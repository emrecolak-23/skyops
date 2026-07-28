import { Inject, Injectable } from '@nestjs/common';
import { type Clock, CLOCK } from 'src/common/clock';
import {
  DRONE_REPOSITORY,
  type IDroneRepository,
} from 'src/modules/drones/repositories/drone.repository';
import {
  MISSION_REPOSITORY,
  type IMissionRepository,
} from 'src/modules/missions/repositories/mission.repository';
import {
  MAINTENANCE_POLICY,
  type MaintenancePolicy,
} from 'src/modules/drones/domain/maintenance/maintenance-policy';
import {
  buildStatusBreakdown,
  filterDueSoonDrones,
  filterOverdueDrones,
  totalFromBreakdown,
} from './domain/fleet-health';
import { FleetHealthResponseDto } from './dto/fleet-health-response.dto';

@Injectable()
export class FleetService {
  constructor(
    @Inject(DRONE_REPOSITORY) private readonly drones: IDroneRepository,
    @Inject(MISSION_REPOSITORY) private readonly missions: IMissionRepository,
    @Inject(MAINTENANCE_POLICY) private readonly policy: MaintenancePolicy,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async getHealth(): Promise<FleetHealthResponseDto> {
    const now = this.clock.now();

    const [statusCounts, nonRetired, missionsNext24h, avgHours] =
      await Promise.all([
        this.drones.countByStatus(),
        this.drones.findNonRetired(),
        this.missions.countInNext24Hours(now),
        this.drones.averageFlightHours(),
      ]);

    const breakdown = buildStatusBreakdown(statusCounts);
    const overdue = filterOverdueDrones(nonRetired, this.policy, now);
    const dueSoon = filterDueSoonDrones(nonRetired, this.policy, now);

    return {
      totalDrones: totalFromBreakdown(breakdown),
      statusBreakdown: breakdown,
      dueSoonMaintenance: dueSoon.map((d) => ({
        id: d.id,
        serialNumber: d.serialNumber,
        model: d.model,
        nextMaintenanceDueDate: d.nextMaintenanceDueDate?.toISOString() ?? null,
      })),
      overdueMaintenance: overdue.map((d) => ({
        id: d.id,
        serialNumber: d.serialNumber,
        model: d.model,
        nextMaintenanceDueDate: d.nextMaintenanceDueDate?.toISOString() ?? null,
      })),
      missionsNext24Hours: missionsNext24h,
      averageFlightHours: Math.round(avgHours * 100) / 100,
    };
  }
}
