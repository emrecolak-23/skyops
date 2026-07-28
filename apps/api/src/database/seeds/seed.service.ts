import { Inject, Injectable } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { DataSource } from 'typeorm';
import {
  DroneModel,
  DroneStatus,
  MaintenanceStatus,
  MaintenanceType,
  MissionStatus,
  MissionType,
} from '@skyops/shared';
import { Drone } from 'src/modules/drones/entities/drone.entity';
import { Mission } from 'src/modules/missions/entities/mission.entity';
import { MaintenanceLog } from 'src/modules/maintenance/entities/maintenance-log.entity';
import {
  MAINTENANCE_POLICY,
  type MaintenancePolicy,
} from 'src/modules/drones/domain/maintenance/maintenance-policy';
import { buildMaintenanceContext } from 'src/modules/drones/domain/maintenance/maintenance-context';

const MODELS = [
  DroneModel.PHANTOM_4,
  DroneModel.MATRICE_300,
  DroneModel.MAVIC_3_ENTERPRISE,
];
const MISSION_TYPES = [
  MissionType.WIND_TURBINE_INSPECTION,
  MissionType.SOLAR_PANEL_SURVEY,
  MissionType.POWER_LINE_PATROL,
];
const MAINT_TYPES = [
  MaintenanceType.ROUTINE_CHECK,
  MaintenanceType.BATTERY_REPLACEMENT,
  MaintenanceType.MOTOR_REPAIR,
  MaintenanceType.FIRMWARE_UPDATE,
];

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

@Injectable()
export class SeedService {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(MAINTENANCE_POLICY) private readonly policy: MaintenancePolicy,
  ) {}

  async run(): Promise<void> {
    faker.seed(20260726);
    const now = new Date();
    await this.clear();

    const drones = await this.seedDrones(now);
    await this.seedMissions(drones, now);
    await this.seedMaintenanceLogs(drones, now);

    console.log(
      `Seeded ${drones.length} drones, missions and maintenance logs.`,
    );
  }

  private async clear(): Promise<void> {
    await this.dataSource.query(
      'TRUNCATE "maintenance_logs", "missions", "drones" RESTART IDENTITY CASCADE',
    );
  }

  private async seedDrones(now: Date): Promise<Drone[]> {
    const repo = this.dataSource.getRepository(Drone);
    const drones: Drone[] = [];

    for (let i = 0; i < 22; i++) {
      const registeredAt = new Date(now.getTime() - (30 + i * 5) * DAY);
      const block1 = String(1000 + i).slice(-4);
      const block2 = ['ALFA', 'BETA', 'GMMA', 'DLTA', 'ECHO'][i % 5];
      const serial = `SKY-${block1}-${block2}`;

      let status = DroneStatus.AVAILABLE;
      let totalFlightHours = 5 + i * 2;
      let lastMaintenanceDate: Date | null = new Date(
        now.getTime() - (10 + i) * DAY,
      );
      let flightHoursAtLastMaintenance = totalFlightHours - 3;

      if (i % 7 === 0) {
        totalFlightHours = 120 + i;
        flightHoursAtLastMaintenance = totalFlightHours - 60;
      } else if (i % 5 === 0) {
        lastMaintenanceDate = new Date(now.getTime() - 120 * DAY);
      } else if (i === 1 || i === 2) {
        const daysSinceMaintenance = i === 1 ? 85 : 87;
        lastMaintenanceDate = new Date(
          now.getTime() - daysSinceMaintenance * DAY,
        );
        totalFlightHours = 15;
        flightHoursAtLastMaintenance = 12;
      } else if (i % 11 === 0) {
        status = DroneStatus.RETIRED;
      } else if (i === 3) {
        status = DroneStatus.MAINTENANCE;
      }

      const drone = repo.create({
        serialNumber: serial,
        model: pick(MODELS, i),
        status,
        totalFlightHours,
        flightHoursAtLastMaintenance,
        lastMaintenanceDate,
        registeredAt,
        nextMaintenanceDueDate: null,
      });

      const ctx = buildMaintenanceContext(drone, now);
      drone.nextMaintenanceDueDate = this.policy.evaluate(ctx).dueDate;

      drones.push(await repo.save(drone));
    }

    return drones;
  }

  private async seedMissions(drones: Drone[], now: Date): Promise<void> {
    const repo = this.dataSource.getRepository(Mission);
    const assignable = drones.filter((d) => d.status !== DroneStatus.RETIRED);

    for (let i = 0; i < 52; i++) {
      const drone = assignable[i % assignable.length];
      let status: MissionStatus;
      let plannedStart: Date;
      let plannedEnd: Date;
      let actualStart: Date | null = null;
      let actualEnd: Date | null = null;
      let flightHoursLogged: number | null = null;
      let abortReason: string | null = null;

      const bucket = i % 5;
      if (bucket === 0) {
        plannedStart = new Date(now.getTime() - (20 + i) * DAY);
        plannedEnd = new Date(plannedStart.getTime() + 2 * HOUR);
        status = MissionStatus.COMPLETED;
        actualStart = plannedStart;
        actualEnd = plannedEnd;
        flightHoursLogged = 2 + (i % 3);
      } else if (bucket === 1) {
        plannedStart = new Date(now.getTime() - (15 + i) * DAY);
        plannedEnd = new Date(plannedStart.getTime() + 2 * HOUR);
        status = MissionStatus.ABORTED;
        abortReason = 'High winds at site';
      } else if (bucket === 2) {
        plannedStart = new Date(now.getTime() + (2 + (i % 10)) * HOUR);
        plannedEnd = new Date(plannedStart.getTime() + 2 * HOUR);
        status = MissionStatus.PLANNED;
      } else {
        plannedStart = new Date(now.getTime() + (5 + i) * DAY);
        plannedEnd = new Date(plannedStart.getTime() + 2 * HOUR);
        status = MissionStatus.PLANNED;
      }

      const mission = repo.create({
        name: `${faker.location.city()} ${pick(MISSION_TYPES, i).replace(/_/g, ' ').toLowerCase()}`,
        type: pick(MISSION_TYPES, i),
        droneId: drone.id,
        pilotName: faker.person.fullName(),
        siteLocation:
          faker.location.city() +
          ' ' +
          faker.helpers.arrayElement([
            'Wind Farm',
            'Solar Field',
            'Power Line',
          ]),
        status,
        plannedStart,
        plannedEnd,
        actualStart,
        actualEnd,
        flightHoursLogged,
        abortReason,
      });
      await repo.save(mission);
    }
  }

  private async seedMaintenanceLogs(drones: Drone[], now: Date): Promise<void> {
    const repo = this.dataSource.getRepository(MaintenanceLog);
    const target = drones.filter((d) => d.status !== DroneStatus.RETIRED);

    for (let i = 0; i < 32; i++) {
      const drone = target[i % target.length];
      const startedAt = new Date(now.getTime() - (5 + i * 2) * DAY);
      const isCompleted =
        drone.status !== DroneStatus.MAINTENANCE || i % 4 !== 0;

      const log = repo.create({
        droneId: drone.id,
        type: pick(MAINT_TYPES, i),
        technicianName: faker.person.fullName(),
        notes: i % 3 === 0 ? faker.lorem.sentence() : null,
        flightHoursAtMaintenance: Number(drone.flightHoursAtLastMaintenance),
        status: isCompleted
          ? MaintenanceStatus.COMPLETED
          : MaintenanceStatus.IN_PROGRESS,
        startedAt,
        completedAt: isCompleted
          ? new Date(startedAt.getTime() + 3 * HOUR)
          : null,
      });
      await repo.save(log);
    }
  }
}
