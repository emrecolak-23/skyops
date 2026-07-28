import {
  DroneModel,
  DroneStatus,
  MissionStatus,
  MissionType,
} from '@skyops/shared';
import { FleetService } from './fleet.service';
import { InMemoryDroneRepository } from 'src/modules/drones/repositories/in-memory-drone.repository';
import { InMemoryMissionRepository } from 'src/modules/missions/repositories/in-memory-mission.repository';
import { FixedClock } from 'src/common/clock/clock';
import { CompositeMaintenancePolicy } from 'src/modules/drones/domain/maintenance/composite-maintenance.policy';
import { CalendarIntervalPolicy } from 'src/modules/drones/domain/maintenance/calendar-interval.policy';
import { FlightHoursPolicy } from 'src/modules/drones/domain/maintenance/flight-hours.policy';

describe('FleetService', () => {
  let droneRepo: InMemoryDroneRepository;
  let missionRepo: InMemoryMissionRepository;
  let service: FleetService;
  const now = new Date('2026-08-01T00:00:00.000Z');

  async function addDrone(overrides = {}) {
    const drone = droneRepo.create({
      serialNumber: 'SKY-A1B2-C3D4',
      model: DroneModel.MATRICE_300,
      status: DroneStatus.AVAILABLE,
      totalFlightHours: 0,
      flightHoursAtLastMaintenance: 0,
      lastMaintenanceDate: null,
      registeredAt: now,
      nextMaintenanceDueDate: null,
      ...overrides,
    });
    return droneRepo.save(drone);
  }

  beforeEach(() => {
    droneRepo = new InMemoryDroneRepository();
    missionRepo = new InMemoryMissionRepository();
    service = new FleetService(
      droneRepo,
      missionRepo,
      new CompositeMaintenancePolicy([
        new CalendarIntervalPolicy(90),
        new FlightHoursPolicy(50),
      ]),
      new FixedClock(now),
    );
  });

  it('reports total and status breakdown', async () => {
    await addDrone({
      serialNumber: 'SKY-0001-0001',
      status: DroneStatus.AVAILABLE,
    });
    await addDrone({
      serialNumber: 'SKY-0002-0002',
      status: DroneStatus.MAINTENANCE,
    });

    const health = await service.getHealth();

    expect(health.totalDrones).toBe(2);
    expect(health.statusBreakdown.AVAILABLE).toBe(1);
    expect(health.statusBreakdown.MAINTENANCE).toBe(1);
    expect(health.statusBreakdown.RETIRED).toBe(0);
  });

  it('lists drones with overdue maintenance', async () => {
    await addDrone({ serialNumber: 'SKY-0001-0001', totalFlightHours: 60 }); // over 50h
    await addDrone({ serialNumber: 'SKY-0002-0002', totalFlightHours: 5 }); // fine

    const health = await service.getHealth();

    expect(health.overdueMaintenance).toHaveLength(1);
    expect(health.overdueMaintenance[0].serialNumber).toBe('SKY-0001-0001');
  });

  it('rounds average flight hours to two decimals', async () => {
    await addDrone({ serialNumber: 'SKY-0001-0001', totalFlightHours: 10 });
    await addDrone({ serialNumber: 'SKY-0002-0002', totalFlightHours: 5 });
    await addDrone({ serialNumber: 'SKY-0003-0003', totalFlightHours: 2 });

    const health = await service.getHealth();

    expect(health.averageFlightHours).toBe(5.67);
  });

  it('counts missions in the next 24 hours', async () => {
    const drone = await addDrone({ serialNumber: 'SKY-0001-0001' });
    const soon = missionRepo.create({
      name: 'Soon',
      type: MissionType.SOLAR_PANEL_SURVEY,
      droneId: drone.id,
      pilotName: 'P',
      siteLocation: 'S',
      status: MissionStatus.PLANNED,
      plannedStart: new Date(now.getTime() + 5 * 60 * 60 * 1000),
      plannedEnd: new Date(now.getTime() + 6 * 60 * 60 * 1000),
      actualStart: null,
      actualEnd: null,
      flightHoursLogged: null,
      abortReason: null,
    });
    await missionRepo.save(soon);

    const health = await service.getHealth();

    expect(health.missionsNext24Hours).toBe(1);
  });

  it('lists drones with maintenance due soon', async () => {
    const dueDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    await addDrone({
      serialNumber: 'SKY-0003-0003',
      lastMaintenanceDate: new Date(now.getTime() - 87 * 24 * 60 * 60 * 1000),
      nextMaintenanceDueDate: dueDate,
      totalFlightHours: 15,
      flightHoursAtLastMaintenance: 12,
    });

    const health = await service.getHealth();
    expect(health.dueSoonMaintenance).toHaveLength(1);
  });
});
