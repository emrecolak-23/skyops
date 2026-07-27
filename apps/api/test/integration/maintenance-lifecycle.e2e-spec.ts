import request from 'supertest';
import {
  setupIntegration,
  teardownIntegration,
  IntegrationContext,
} from './setup';

describe('Maintenance lifecycle (integration)', () => {
  let ctx: IntegrationContext;

  beforeAll(async () => {
    ctx = await setupIntegration();
  }, 120_000);

  afterAll(async () => {
    await teardownIntegration(ctx);
  });

  it('opens maintenance (drone -> MAINTENANCE) and completes it (drone -> AVAILABLE, tracking updated)', async () => {
    const server = ctx.server;

    const droneRes = await request(server)
      .post('/api/drones')
      .send({ serialNumber: 'SKY-MNT9-0001', model: 'MATRICE_300' })
      .expect(201);
    const droneId = droneRes.body.id;
    expect(droneRes.body.status).toBe('AVAILABLE');

    const openRes = await request(server)
      .post('/api/maintenance-logs')
      .send({
        droneId,
        type: 'ROUTINE_CHECK',
        technicianName: 'Tech A',
        flightHoursAtMaintenance: 0,
      })
      .expect(201);
    const logId = openRes.body.id;
    expect(openRes.body.status).toBe('IN_PROGRESS');
    expect(openRes.body.startedAt).toBeDefined();
    expect(openRes.body.completedAt).toBeNull();

    const duringMaint = await request(server)
      .get(`/api/drones/${droneId}`)
      .expect(200);
    expect(duringMaint.body.status).toBe('MAINTENANCE');

    const completeRes = await request(server)
      .patch(`/api/maintenance-logs/${logId}/complete`)
      .expect(200);
    expect(completeRes.body.status).toBe('COMPLETED');
    expect(completeRes.body.completedAt).not.toBeNull();

    const afterMaint = await request(server)
      .get(`/api/drones/${droneId}`)
      .expect(200);
    expect(afterMaint.body.status).toBe('AVAILABLE');
    expect(afterMaint.body.lastMaintenanceDate).not.toBeNull();
    expect(afterMaint.body.nextMaintenanceDueDate).not.toBeNull();
  });

  it('rejects opening maintenance for a drone that is in a mission', async () => {
    const server = ctx.server;

    const droneRes = await request(server)
      .post('/api/drones')
      .send({ serialNumber: 'SKY-MNT9-0002', model: 'MATRICE_300' })
      .expect(201);
    const droneId = droneRes.body.id;

    const start = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const end = new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString();
    const missionRes = await request(server)
      .post('/api/missions')
      .send({
        name: 'Occupying',
        type: 'POWER_LINE_PATROL',
        droneId,
        pilotName: 'Pilot',
        siteLocation: 'Site',
        plannedStart: start,
        plannedEnd: end,
      })
      .expect(201);
    await request(server)
      .patch(`/api/missions/${missionRes.body.id}/pre-flight`)
      .expect(200);
    await request(server)
      .patch(`/api/missions/${missionRes.body.id}/start`)
      .expect(200);

    await request(server)
      .post('/api/maintenance-logs')
      .send({
        droneId,
        type: 'MOTOR_REPAIR',
        technicianName: 'Tech B',
        flightHoursAtMaintenance: 0,
      })
      .expect(409);
  });
});
