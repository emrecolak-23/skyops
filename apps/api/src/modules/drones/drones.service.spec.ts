import { DroneModel, DroneStatus } from '@skyops/shared';
import { DronesService } from './drones.service';
import { InMemoryDroneRepository } from './repositories/in-memory-drone.repository';
import { FixedClock } from 'src/common/clock/clock';
import { CalendarIntervalPolicy } from './domain/maintenance/calendar-interval.policy';
import {
  DroneNotFoundError,
  DuplicateSerialNumberError,
  DroneCannotBeRetiredError,
} from './domain/drone.errors';
import { ActiveMissionChecker } from './ports';

describe('DronesService', () => {
  let repository: InMemoryDroneRepository;
  let service: DronesService;
  let hasActive: boolean;

  const now = new Date('2026-01-15T00:00:00.000Z');

  const checker: ActiveMissionChecker = {
    hasActiveMissions: () => Promise.resolve(hasActive),
  };

  beforeEach(() => {
    hasActive = false;
    repository = new InMemoryDroneRepository();
    service = new DronesService(
      repository,
      new CalendarIntervalPolicy(90),
      new FixedClock(now),
      checker,
    );
  });

  describe('create', () => {
    it('creates a drone with AVAILABLE status', async () => {
      const drone = await service.create({
        serialNumber: 'SKY-A1B2-C3D4',
        model: DroneModel.MATRICE_300,
      });

      expect(drone.status).toBe(DroneStatus.AVAILABLE);
      expect(drone.serialNumber).toBe('SKY-A1B2-C3D4');
      expect(drone.model).toBe(DroneModel.MATRICE_300);
    });

    it('starts a new drone with zero flight hours', async () => {
      const drone = await service.create({
        serialNumber: 'SKY-A1B2-C3D4',
        model: DroneModel.PHANTOM_4,
      });

      expect(drone.totalFlightHours).toBe(0);
    });

    it('sets next maintenance due date to registration + interval', async () => {
      const drone = await service.create({
        serialNumber: 'SKY-A1B2-C3D4',
        model: DroneModel.PHANTOM_4,
      });

      expect(drone.nextMaintenanceDueDate?.toISOString()).toBe(
        '2026-04-15T00:00:00.000Z',
      );
    });

    it('leaves last maintenance date null for a new drone', async () => {
      const drone = await service.create({
        serialNumber: 'SKY-A1B2-C3D4',
        model: DroneModel.PHANTOM_4,
      });

      expect(drone.lastMaintenanceDate).toBeNull();
    });

    it('persists the created drone', async () => {
      const drone = await service.create({
        serialNumber: 'SKY-A1B2-C3D4',
        model: DroneModel.PHANTOM_4,
      });

      const found = await repository.findById(drone.id);
      expect(found).not.toBeNull();
    });

    it('rejects a duplicate serial number', async () => {
      await service.create({
        serialNumber: 'SKY-A1B2-C3D4',
        model: DroneModel.PHANTOM_4,
      });

      await expect(
        service.create({
          serialNumber: 'SKY-A1B2-C3D4',
          model: DroneModel.MATRICE_300,
        }),
      ).rejects.toThrow(DuplicateSerialNumberError);
    });
  });

  describe('findById', () => {
    it('returns an existing drone', async () => {
      const created = await service.create({
        serialNumber: 'SKY-A1B2-C3D4',
        model: DroneModel.PHANTOM_4,
      });

      const found = await service.findById(created.id);
      expect(found).toEqual(created);
    });

    it('throws DroneNotFoundError for an unknown id', async () => {
      await expect(service.findById('missing-id')).rejects.toThrow(
        DroneNotFoundError,
      );
    });
  });

  describe('retire', () => {
    it('retires a drone with no active missions', async () => {
      const drone = await service.create({
        serialNumber: 'SKY-A1B2-C3D4',
        model: DroneModel.PHANTOM_4,
      });

      hasActive = false;

      const retired = await service.retire(drone.id);
      expect(retired.status).toBe(DroneStatus.RETIRED);
    });

    it('refuses to retire a drone with active missions', async () => {
      const drone = await service.create({
        serialNumber: 'SKY-A1B2-C3D4',
        model: DroneModel.PHANTOM_4,
      });
      hasActive = true;

      await expect(service.retire(drone.id)).rejects.toThrow(
        DroneCannotBeRetiredError,
      );
    });

    it('throws DroneNotFoundError when retiring an unknown drone', async () => {
      await expect(service.retire('missing-id')).rejects.toThrow(
        DroneNotFoundError,
      );
    });
  });
});
