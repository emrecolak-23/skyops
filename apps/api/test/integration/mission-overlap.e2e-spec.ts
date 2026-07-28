import request from 'supertest';
import {
  setupIntegration,
  teardownIntegration,
  IntegrationContext,
} from './setup';

describe('Mission overlap constraint (integration)', () => {
  let ctx: IntegrationContext;

  beforeAll(async () => {
    ctx = await setupIntegration();
  }, 120_000);

  afterAll(async () => {
    await teardownIntegration(ctx);
  });

  it('rejects a second mission overlapping the same drone', async () => {
    const server = ctx.server;

    const droneRes = await request(server)
      .post('/api/drones')
      .send({ serialNumber: 'SKY-OVL1-0001', model: 'PHANTOM_4' })
      .expect(201);
    const droneId = droneRes.body.id;

    const start = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const end = new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString();

    await request(server)
      .post('/api/missions')
      .send({
        name: 'First',
        type: 'SOLAR_PANEL_SURVEY',
        droneId,
        pilotName: 'Pilot A',
        siteLocation: 'Site',
        plannedStart: start,
        plannedEnd: end,
      })
      .expect(201);

    const overlapStart = new Date(
      Date.now() + 25 * 60 * 60 * 1000,
    ).toISOString();
    const overlapEnd = new Date(Date.now() + 27 * 60 * 60 * 1000).toISOString();
    await request(server)
      .post('/api/missions')
      .send({
        name: 'Overlapping',
        type: 'SOLAR_PANEL_SURVEY',
        droneId,
        pilotName: 'Pilot B',
        siteLocation: 'Site',
        plannedStart: overlapStart,
        plannedEnd: overlapEnd,
      })
      .expect(409);
  });

  it('allows adjacent (non-overlapping) missions on the same drone', async () => {
    const server = ctx.server;

    const droneRes = await request(server)
      .post('/api/drones')
      .send({ serialNumber: 'SKY-OVL2-0002', model: 'PHANTOM_4' })
      .expect(201);
    const droneId = droneRes.body.id;

    const start1 = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const end1 = new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString();
    await request(server)
      .post('/api/missions')
      .send({
        name: 'Block 1',
        type: 'SOLAR_PANEL_SURVEY',
        droneId,
        pilotName: 'Pilot',
        siteLocation: 'Site',
        plannedStart: start1,
        plannedEnd: end1,
      })
      .expect(201);

    const start2 = end1;
    const end2 = new Date(Date.now() + 28 * 60 * 60 * 1000).toISOString();
    await request(server)
      .post('/api/missions')
      .send({
        name: 'Block 2',
        type: 'SOLAR_PANEL_SURVEY',
        droneId,
        pilotName: 'Pilot',
        siteLocation: 'Site',
        plannedStart: start2,
        plannedEnd: end2,
      })
      .expect(201);
  });

  it('allows rescheduling a mission into its own window and into a free window', async () => {
    const server = ctx.server;

    const droneRes = await request(server)
      .post('/api/drones')
      .send({ serialNumber: 'SKY-RSC1-0001', model: 'PHANTOM_4' })
      .expect(201);
    const droneId = droneRes.body.id;

    const start = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const end = new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString();

    const missionRes = await request(server)
      .post('/api/missions')
      .send({
        name: 'Reschedulable',
        type: 'SOLAR_PANEL_SURVEY',
        droneId,
        pilotName: 'Pilot',
        siteLocation: 'Site',
        plannedStart: start,
        plannedEnd: end,
      })
      .expect(201);
    const missionId = missionRes.body.id;

    await request(server)
      .patch(`/api/missions/${missionId}/reschedule`)
      .send({ plannedStart: start, plannedEnd: end })
      .expect(200);

    const movedStart = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const movedEnd = new Date(Date.now() + 50 * 60 * 60 * 1000).toISOString();

    const moved = await request(server)
      .patch(`/api/missions/${missionId}/reschedule`)
      .send({ plannedStart: movedStart, plannedEnd: movedEnd })
      .expect(200);

    const movedBody = moved.body as { plannedStart: string };
    expect(movedBody.plannedStart).toBe(movedStart);
  });

  it('rejects a reschedule payload that tries to set the status', async () => {
    const server = ctx.server;

    const droneRes = await request(server)
      .post('/api/drones')
      .send({ serialNumber: 'SKY-RSC2-0002', model: 'PHANTOM_4' })
      .expect(201);

    const start = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const end = new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString();

    const missionRes = await request(server)
      .post('/api/missions')
      .send({
        name: 'Whitelist probe',
        type: 'SOLAR_PANEL_SURVEY',
        droneId: droneRes.body.id,
        pilotName: 'Pilot',
        siteLocation: 'Site',
        plannedStart: start,
        plannedEnd: end,
      })
      .expect(201);

    await request(server)
      .patch(`/api/missions/${missionRes.body.id}/reschedule`)
      .send({ plannedStart: start, plannedEnd: end, status: 'COMPLETED' })
      .expect(400);
  });

  it('reassigns a mission to another drone when the original goes into maintenance', async () => {
    const server = ctx.server;

    const droneA = (
      await request(server)
        .post('/api/drones')
        .send({ serialNumber: 'SKY-RSC3-0003', model: 'MATRICE_300' })
        .expect(201)
    ).body;

    const droneB = (
      await request(server)
        .post('/api/drones')
        .send({ serialNumber: 'SKY-RSC3-0004', model: 'MATRICE_300' })
        .expect(201)
    ).body;

    const start = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const end = new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString();

    const missionRes = await request(server)
      .post('/api/missions')
      .send({
        name: 'Grounded',
        type: 'POWER_LINE_PATROL',
        droneId: droneA.id,
        pilotName: 'Pilot',
        siteLocation: 'Site',
        plannedStart: start,
        plannedEnd: end,
      })
      .expect(201);
    const missionId = missionRes.body.id;

    await request(server)
      .patch(`/api/missions/${missionId}/pre-flight`)
      .expect(200);

    await request(server)
      .post('/api/maintenance-logs')
      .send({
        droneId: droneA.id,
        type: 'ROUTINE_CHECK',
        technicianName: 'Tech',
        flightHoursAtMaintenance: 0,
      })
      .expect(201);

    await request(server).patch(`/api/missions/${missionId}/start`).expect(409);

    await request(server)
      .patch(`/api/missions/${missionId}/reschedule`)
      .send({ plannedStart: start, plannedEnd: end })
      .expect(409);

    const reassigned = await request(server)
      .patch(`/api/missions/${missionId}/reschedule`)
      .send({ plannedStart: start, plannedEnd: end, droneId: droneB.id })
      .expect(200);
    expect(reassigned.body.droneId).toBe(droneB.id);

    const started = await request(server)
      .patch(`/api/missions/${missionId}/start`)
      .expect(200);
    expect(started.body.status).toBe('IN_PROGRESS');
  });
});
