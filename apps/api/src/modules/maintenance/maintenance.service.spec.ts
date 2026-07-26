import {
  DroneModel,
  DroneStatus,
  MaintenanceStatus,
  MaintenanceType,
} from '@skyops/shared';
import { MaintenanceService } from './maintenance.service';
import { InMemoryMaintenanceLogRepository } from './repositories/in-memory-maintenance-log.repository';
import { InMemoryDroneRepository } from 'src/modules/drones/repositories/in-memory-drone.repository';
import { DronesService } from 'src/modules/drones/drones.service';
import { FixedClock } from 'src/common/clock/clock';
import { CompositeMaintenancePolicy } from 'src/modules/drones/domain/maintenance/composite-maintenance.policy';
import { CalendarIntervalPolicy } from 'src/modules/drones/domain/maintenance/calendar-interval.policy';
import { FlightHoursPolicy } from 'src/modules/drones/domain/maintenance/flight-hours.policy';
import { Tx } from 'src/common/persistence/tx';
import { TransactionRunner } from 'src/common/persistence/transaction-runner';
import { Drone } from 'src/modules/drones/entities/drone.entity';
import {
  InconsistentFlightHoursError,
  MaintenanceAlreadyCompletedError,
  DroneNotAvailableForMaintenanceError,
} from './domain/maintenance.errors';

class NoopTransactionRunner implements TransactionRunner {
  run<T>(fn: (tx?: Tx) => Promise<T>): Promise<T> {
    return fn(undefined);
  }
}

describe('MaintenanceService', () => {
  let logRepo: InMemoryMaintenanceLogRepository;
  let droneRepo: InMemoryDroneRepository;
  let dronesService: DronesService;
  let service: MaintenanceService;
  const now = new Date('2026-08-01T00:00:00.000Z');
  const tolerance = 1.0;

  async function seedDrone(
    status = DroneStatus.AVAILABLE,
    totalFlightHours = 60,
  ) {
    const drone = droneRepo.create({
      serialNumber: 'SKY-A1B2-C3D4',
      model: DroneModel.MATRICE_300,
      status,
      totalFlightHours,
      flightHoursAtLastMaintenance: 0,
      lastMaintenanceDate: null,
      registeredAt: new Date('2026-01-01T00:00:00.000Z'),
      nextMaintenanceDueDate: null,
    });
    return droneRepo.save(drone);
  }

  const openInput = (droneId: string, overrides = {}) => ({
    droneId,
    type: MaintenanceType.ROUTINE_CHECK,
    technicianName: 'Bob',
    flightHoursAtMaintenance: 60,
    ...overrides,
  });

  beforeEach(() => {
    logRepo = new InMemoryMaintenanceLogRepository();
    droneRepo = new InMemoryDroneRepository();
    dronesService = new DronesService(
      droneRepo,
      new CompositeMaintenancePolicy([
        new CalendarIntervalPolicy(90),
        new FlightHoursPolicy(50),
      ]),
      new FixedClock(now),
      { hasActiveMissions: () => Promise.resolve(false) },
    );
    service = new MaintenanceService(
      logRepo,
      dronesService,
      new NoopTransactionRunner(),
      new FixedClock(now),
      tolerance,
    );
  });

  describe('open', () => {
    it('creates a log in IN_PROGRESS and puts the drone in MAINTENANCE', async () => {
      const drone = await seedDrone();
      const log = await service.open(openInput(drone.id));

      expect(log.status).toBe(MaintenanceStatus.IN_PROGRESS);
      expect(log.startedAt).toEqual(now);

      const freshDrone = await droneRepo.findById(drone.id);
      expect(freshDrone?.status).toBe(DroneStatus.MAINTENANCE);
    });

    it('rejects opening maintenance for a drone in mission', async () => {
      const drone = await seedDrone(DroneStatus.IN_MISSION);
      await expect(service.open(openInput(drone.id))).rejects.toThrow(
        DroneNotAvailableForMaintenanceError,
      );
    });

    it('rejects inconsistent flight hours', async () => {
      const drone = await seedDrone(DroneStatus.AVAILABLE, 60);
      await expect(
        service.open(openInput(drone.id, { flightHoursAtMaintenance: 100 })), // 40h off
      ).rejects.toThrow(InconsistentFlightHoursError);
    });
  });

  describe('complete', () => {
    it('completes the log, frees the drone and resets maintenance tracking', async () => {
      const drone = await seedDrone();
      const log = await service.open(openInput(drone.id));

      const completed = await service.complete(log.id);

      expect(completed.status).toBe(MaintenanceStatus.COMPLETED);
      expect(completed.completedAt).toEqual(now);

      const freshDrone = await droneRepo.findById(drone.id);
      expect(freshDrone?.status).toBe(DroneStatus.AVAILABLE);
      expect(freshDrone?.lastMaintenanceDate).toEqual(now);
      expect(freshDrone?.flightHoursAtLastMaintenance).toBe(60);
    });

    it('rejects completing an already completed log', async () => {
      const drone = await seedDrone();
      const log = await service.open(openInput(drone.id));
      await service.complete(log.id);

      await expect(service.complete(log.id)).rejects.toThrow(
        MaintenanceAlreadyCompletedError,
      );
    });
  });
});
