import { DroneStatus, MissionStatus } from '@skyops/shared';
import { Drone } from 'src/modules/drones/entities/drone.entity';
import { Mission } from '../../entities/mission.entity';
import { StartPreFlightTransition } from './start-preflight.transition';
import { StartMissionTransition } from './start-mission.transition';
import { CompleteMissionTransition } from './complete-mission.transition';
import { AbortMissionTransition } from './abort-mission.transition';
import {
  DroneMaintenanceDueError,
  DroneNotAvailableError,
} from '../mission.errors';

const now = new Date('2026-08-01T10:00:00.000Z');

function makeMission(status: MissionStatus): Mission {
  const m = new Mission();
  m.status = status;
  return m;
}

function makeDrone(status: DroneStatus, flightHours = 100): Drone {
  const d = new Drone();
  d.status = status;
  d.totalFlightHours = flightHours;
  return d;
}

describe('StartPreFlightTransition', () => {
  const transition = new StartPreFlightTransition();

  it('moves mission to PRE_FLIGHT_CHECK', () => {
    const mission = makeMission(MissionStatus.PLANNED);
    const drone = makeDrone(DroneStatus.AVAILABLE);

    transition.apply({ mission, drone, now, maintenanceDue: false });

    expect(mission.status).toBe(MissionStatus.PRE_FLIGHT_CHECK);
  });
});

describe('StartMissionTransition', () => {
  const transition = new StartMissionTransition();

  it('moves mission to IN_PROGRESS and sets actualStart', () => {
    const mission = makeMission(MissionStatus.PRE_FLIGHT_CHECK);
    const drone = makeDrone(DroneStatus.AVAILABLE);

    transition.apply({ mission, drone, now, maintenanceDue: false });

    expect(mission.status).toBe(MissionStatus.IN_PROGRESS);
    expect(mission.actualStart).toEqual(now);
  });

  it('marks the drone as IN_MISSION', () => {
    const mission = makeMission(MissionStatus.PRE_FLIGHT_CHECK);
    const drone = makeDrone(DroneStatus.AVAILABLE);

    transition.apply({ mission, drone, now, maintenanceDue: false });

    expect(drone.status).toBe(DroneStatus.IN_MISSION);
  });

  it('rejects starting when the drone is not available', () => {
    const mission = makeMission(MissionStatus.PRE_FLIGHT_CHECK);
    const drone = makeDrone(DroneStatus.MAINTENANCE);

    expect(() =>
      transition.apply({ mission, drone, now, maintenanceDue: false }),
    ).toThrow(DroneNotAvailableError);
  });

  it('rejects starting when the drone has maintenance due', () => {
    const mission = makeMission(MissionStatus.PRE_FLIGHT_CHECK);
    const drone = makeDrone(DroneStatus.AVAILABLE);

    expect(() =>
      transition.apply({ mission, drone, now, maintenanceDue: true }),
    ).toThrow(DroneMaintenanceDueError);
    expect(mission.status).toBe(MissionStatus.PRE_FLIGHT_CHECK);
    expect(drone.status).toBe(DroneStatus.AVAILABLE);
  });
});

describe('CompleteMissionTransition', () => {
  const transition = new CompleteMissionTransition();

  it('moves mission to COMPLETED and sets actualEnd', () => {
    const mission = makeMission(MissionStatus.IN_PROGRESS);
    const drone = makeDrone(DroneStatus.IN_MISSION);

    transition.apply({
      mission,
      drone,
      now,
      maintenanceDue: false,
      flightHoursLogged: 2.5,
    });

    expect(mission.status).toBe(MissionStatus.COMPLETED);
    expect(mission.actualEnd).toEqual(now);
  });

  it('logs flight hours on the mission', () => {
    const mission = makeMission(MissionStatus.IN_PROGRESS);
    const drone = makeDrone(DroneStatus.IN_MISSION);

    transition.apply({
      mission,
      drone,
      now,
      maintenanceDue: false,
      flightHoursLogged: 2.5,
    });

    expect(mission.flightHoursLogged).toBe(2.5);
  });

  it('adds flight hours to the drone total', () => {
    const mission = makeMission(MissionStatus.IN_PROGRESS);
    const drone = makeDrone(DroneStatus.IN_MISSION, 100);

    transition.apply({
      mission,
      drone,
      now,
      maintenanceDue: false,
      flightHoursLogged: 2.5,
    });

    expect(drone.totalFlightHours).toBe(102.5);
  });

  it('frees the drone back to AVAILABLE', () => {
    const mission = makeMission(MissionStatus.IN_PROGRESS);
    const drone = makeDrone(DroneStatus.IN_MISSION);

    transition.apply({
      mission,
      drone,
      now,
      maintenanceDue: false,
      flightHoursLogged: 2.5,
    });

    expect(drone.status).toBe(DroneStatus.AVAILABLE);
  });
});

describe('AbortMissionTransition', () => {
  const transition = new AbortMissionTransition();

  it('moves mission to ABORTED with a reason and actualEnd', () => {
    const mission = makeMission(MissionStatus.IN_PROGRESS);
    const drone = makeDrone(DroneStatus.IN_MISSION);

    transition.apply({
      mission,
      drone,
      now,
      maintenanceDue: false,
      abortReason: 'weather',
    });

    expect(mission.status).toBe(MissionStatus.ABORTED);
    expect(mission.actualEnd).toEqual(now);
    expect(mission.abortReason).toBe('weather');
  });

  it('frees the drone if it was in mission', () => {
    const mission = makeMission(MissionStatus.IN_PROGRESS);
    const drone = makeDrone(DroneStatus.IN_MISSION);

    transition.apply({
      mission,
      drone,
      now,
      maintenanceDue: false,
      abortReason: 'weather',
    });

    expect(drone.status).toBe(DroneStatus.AVAILABLE);
  });

  it('does not change drone status if aborting before it was in mission', () => {
    const mission = makeMission(MissionStatus.PLANNED);
    const drone = makeDrone(DroneStatus.AVAILABLE);

    transition.apply({
      mission,
      drone,
      now,
      maintenanceDue: false,
      abortReason: 'cancelled',
    });

    expect(drone.status).toBe(DroneStatus.AVAILABLE);
  });
});
