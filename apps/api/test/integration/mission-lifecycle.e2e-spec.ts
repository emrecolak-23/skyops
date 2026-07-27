import request from 'supertest';
import {
  setupIntegration,
  teardownIntegration,
  IntegrationContext,
} from './setup';

describe('Mission lifecyle integration', () => {
  let ctx: IntegrationContext;

  beforeAll(async () => {
    ctx = await setupIntegration();
  }, 120000);

  afterAll(async () => {
    await teardownIntegration(ctx);
  });

  it('runs the full lifecylce: create drone -> schedule -> start -> complete -> verify', async () => {
    const server = ctx.server;

    const droneRes = await request(server)
      .post('/api/drones')
      .send({ serialNumber: 'SKY-INT1-0001', model: 'MATRICE_300' })
      .expect(201);

    const droneId = droneRes.body.id;

    expect(droneRes.body.status).toBe('AVAILABLE');
    expect(droneRes.body.totalFlightHours).toBe(0);

    const start = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const end = new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString();

    const missionRes = await request(server)
      .post('/api/missions')
      .send({
        name: 'Integration Turbine',
        type: 'WIND_TURBINE_INSPECTION',
        droneId,
        pilotName: 'Integration Pilot',
        siteLocation: 'Test Site',
        plannedStart: start,
        plannedEnd: end,
      })
      .expect(201);

    const missionId = missionRes.body.id;
    expect(missionRes.body.status).toBe('PLANNED');

    await request(server)
      .patch(`/api/missions/${missionId}/pre-flight`)
      .expect(200);

    const startRes = await request(server)
      .patch(`/api/missions/${missionId}/start`)
      .expect(200);

    expect(startRes.body.status).toBe('IN_PROGRESS');

    const droneInMission = await request(server)
      .get(`/api/drones/${droneId}`)
      .expect(200);
    expect(droneInMission.body.status).toBe('IN_MISSION');

    const completeRes = await request(server)
      .patch(`/api/missions/${missionId}/complete`)
      .send({ flightHoursLogged: 2.5 })
      .expect(200);

    expect(completeRes.body.status).toBe('COMPLETED');
    expect(completeRes.body.flightHoursLogged).toBe(2.5);

    const droneFinal = await request(server)
      .get(`/api/drones/${droneId}`)
      .expect(200);

    expect(droneFinal.body.status).toBe('AVAILABLE');
    expect(droneFinal.body.totalFlightHours).toBe(2.5);
  });
});
