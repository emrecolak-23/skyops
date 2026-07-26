import {
  DroneModel,
  DroneStatus,
  MissionStatus,
  MissionType,
} from '@skyops/shared';
import { MissionsService } from './missions.service';
import { InMemoryMissionRepository } from './repositories/in-memory-mission.repository';
import { InMemoryDroneRepository } from 'src/modules/drones/repositories/in-memory-drone.repository';
import { DronesService } from 'src/modules/drones/drones.service';
import { MissionStateMachine } from './domain/mission-state-machine';
import { MissionTransitionRegistry } from './domain/transitions/mission-transition.registry';
import { FixedClock } from 'src/common/clock/clock';
import { CalendarIntervalPolicy } from 'src/modules/drones/domain/maintenance/calendar-interval.policy';
import { FlightHoursPolicy } from '../drones/domain/maintenance/flight-hours.policy';
import { Tx } from 'src/common/persistence/tx';
import { TransactionRunner } from 'src/common/persistence/transaction-runner';
import { Drone } from 'src/modules/drones/entities/drone.entity';
import {
  MissionInPastError,
  MissionOverlapError,
  InvalidMissionScheduleError,
  DroneNotAvailableError,
  MissionNotFoundError,
  DroneMaintenanceDueError,
} from './domain/mission.errors';
import { DroneNotFoundError } from 'src/modules/drones/domain/drone.errors';
import { InvalidMissionTransitionError } from './domain/mission-state-machine.errors';
import { CompositeMaintenancePolicy } from '../drones/domain/maintenance/composite-maintenance.policy';

class NoopTransactionRunner implements TransactionRunner {
  run<T>(fn: (tx?: Tx) => Promise<T>): Promise<T> {
    return fn(undefined);
  }
}

describe('MissionService', () => {
  let missionRepo: InMemoryMissionRepository;
  let droneRepo: InMemoryDroneRepository;
  let dronesService: DronesService;
  let service: MissionsService;

  const now = new Date('2026-08-01T00:00:00Z');

  async function seedDrone(status = DroneStatus.AVAILABLE): Promise<Drone> {
    const drone = droneRepo.create({
      serialNumber: 'SKY-A1B2-C3D4',
      model: DroneModel.MATRICE_300,
      status,
      totalFlightHours: 0,
      flightHoursAtLastMaintenance: 0,
      lastMaintenanceDate: null,
      registeredAt: now,
      nextMaintenanceDueDate: null,
    });
    return droneRepo.save(drone);
  }

  const validMissionInput = (droneId: string, overrides = {}) => ({
    name: 'Turbine A inspection',
    type: MissionType.WIND_TURBINE_INSPECTION,
    droneId,
    pilotName: 'Jane Doe',
    siteLocation: 'North Field',
    plannedStart: '2026-08-05T09:00:00.000Z',
    plannedEnd: '2026-08-05T11:00:00.000Z',
    ...overrides,
  });

  beforeEach(() => {
    missionRepo = new InMemoryMissionRepository();
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
    service = new MissionsService(
      missionRepo,
      dronesService,
      new MissionStateMachine(),
      new MissionTransitionRegistry(),
      new NoopTransactionRunner(),
      new FixedClock(now),
    );
  });

  describe('create', () => {
    it('creates a mission in PLANNED status', async () => {
      const drone = await seedDrone(DroneStatus.AVAILABLE);
      const mission = await service.create(validMissionInput(drone.id));

      expect(mission.status).toBe(MissionStatus.PLANNED);
      expect(mission.droneId).toBe(drone.id);
    });

    it('throws DroneNotFoundError for an unknown drone', async () => {
      await expect(
        service.create(
          validMissionInput('00000000-0000-0000-0000-000000000000'),
        ),
      ).rejects.toThrow(DroneNotFoundError);
    });

    it('rejects scheduling for a retired drone', async () => {
      const drone = await seedDrone(DroneStatus.RETIRED);
      await expect(service.create(validMissionInput(drone.id))).rejects.toThrow(
        DroneNotAvailableError,
      );
    });

    it('rejects a mission scheduled in the past', async () => {
      const drone = await seedDrone();
      await expect(
        service.create(
          validMissionInput(drone.id, {
            plannedStart: '2026-07-01T09:00:00.000Z',
            plannedEnd: '2026-07-01T11:00:00.000Z',
          }),
        ),
      ).rejects.toThrow(MissionInPastError);
    });

    it('rejects when planned end is not after planned start', async () => {
      const drone = await seedDrone();
      await expect(
        service.create(
          validMissionInput(drone.id, {
            plannedStart: '2026-08-05T11:00:00.000Z',
            plannedEnd: '2026-08-05T09:00:00.000Z',
          }),
        ),
      ).rejects.toThrow(InvalidMissionScheduleError);
    });

    it('rejects an overlapping mission for the same drone', async () => {
      const drone = await seedDrone();
      await service.create(validMissionInput(drone.id));

      await expect(
        service.create(
          validMissionInput(drone.id, {
            plannedStart: '2026-08-05T10:00:00.000Z',
            plannedEnd: '2026-08-05T12:00:00.000Z',
          }),
        ),
      ).rejects.toThrow(MissionOverlapError);
    });

    it('allows adjacent (non-overlapping) missions for the same drone', async () => {
      const drone = await seedDrone();
      await service.create(validMissionInput(drone.id));

      const second = await service.create(
        validMissionInput(drone.id, {
          plannedStart: '2026-08-05T11:00:00.000Z',
          plannedEnd: '2026-08-05T13:00:00.000Z',
        }),
      );

      expect(second.status).toBe(MissionStatus.PLANNED);
    });

    it('rejects scheduling for a drone with maintenance due', async () => {
      const drone = droneRepo.create({
        serialNumber: 'SKY-M2D2-0010',
        model: DroneModel.MATRICE_300,
        status: DroneStatus.AVAILABLE,
        totalFlightHours: 60, // over the 50h threshold
        flightHoursAtLastMaintenance: 0,
        lastMaintenanceDate: null,
        registeredAt: now,
        nextMaintenanceDueDate: null,
      });
      await droneRepo.save(drone);

      await expect(service.create(validMissionInput(drone.id))).rejects.toThrow(
        DroneMaintenanceDueError,
      );
    });
  });

  describe('state transitions', () => {
    async function seedMission() {
      const drone = await seedDrone();
      const mission = await service.create(validMissionInput(drone.id));
      return { drone, mission };
    }

    it('startPreFlight moves PLANNED to PRE_FLIGHT_CHECK', async () => {
      const { mission } = await seedMission();
      const updated = await service.startPreFlight(mission.id);
      expect(updated.status).toBe(MissionStatus.PRE_FLIGHT_CHECK);
    });

    it('start moves PRE_FLIGHT_CHECK to IN_PROGRESS and occupies the drone', async () => {
      const { drone, mission } = await seedMission();
      await service.startPreFlight(mission.id);

      const updated = await service.start(mission.id);
      expect(updated.status).toBe(MissionStatus.IN_PROGRESS);
      expect(updated.actualStart).not.toBeNull();

      const freshDrone = await dronesService.findById(drone.id);
      expect(freshDrone.status).toBe(DroneStatus.IN_MISSION);
    });

    it('complete logs hours, frees the drone and adds to its total', async () => {
      const { drone, mission } = await seedMission();
      await service.startPreFlight(mission.id);
      await service.start(mission.id);

      const { mission: completed } = await service.complete(mission.id, {
        flightHoursLogged: 2.5,
      });
      expect(completed.status).toBe(MissionStatus.COMPLETED);
      expect(completed.flightHoursLogged).toBe(2.5);

      const freshDrone = await droneRepo.findById(drone.id);
      expect(freshDrone?.status).toBe(DroneStatus.AVAILABLE);
      expect(freshDrone?.totalFlightHours).toBe(2.5);
    });

    it('abort requires a reason and frees the drone', async () => {
      const { drone, mission } = await seedMission();
      await service.startPreFlight(mission.id);
      await service.start(mission.id);

      const updated = await service.abort(mission.id, { reason: 'weather' });
      expect(updated.status).toBe(MissionStatus.ABORTED);
      expect(updated.abortReason).toBe('weather');

      const freshDrone = await droneRepo.findById(drone.id);
      expect(freshDrone?.status).toBe(DroneStatus.AVAILABLE);
    });

    it('rejects an invalid transition (complete straight from PLANNED)', async () => {
      const { mission } = await seedMission();
      await expect(
        service.complete(mission.id, { flightHoursLogged: 1 }),
      ).rejects.toThrow(InvalidMissionTransitionError);
    });

    it('throws MissionNotFoundError for an unknown mission', async () => {
      await expect(
        service.startPreFlight('00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow(MissionNotFoundError);
    });
  });

  describe('maintenance due on completion', () => {
    it('reports maintenanceDue true when completing pushes the drone over the flight-hours threshold', async () => {
      const drone = droneRepo.create({
        serialNumber: 'SKY-N1E1-0009',
        model: DroneModel.MATRICE_300,
        status: DroneStatus.AVAILABLE,
        totalFlightHours: 48,
        flightHoursAtLastMaintenance: 0,
        lastMaintenanceDate: null,
        registeredAt: now,
        nextMaintenanceDueDate: null,
      });
      await droneRepo.save(drone);

      const mission = await service.create(validMissionInput(drone.id));
      await service.startPreFlight(mission.id);
      await service.start(mission.id);

      const result = await service.complete(mission.id, {
        flightHoursLogged: 3,
      });

      expect(result.maintenanceDue).toBe(true);
    });

    it('reports maintenanceDue false when still under the threshold', async () => {
      const drone = await seedDrone(); // 0 hours
      const mission = await service.create(validMissionInput(drone.id));
      await service.startPreFlight(mission.id);
      await service.start(mission.id);

      const result = await service.complete(mission.id, {
        flightHoursLogged: 2.5,
      });

      expect(result.maintenanceDue).toBe(false);
    });
  });
});
