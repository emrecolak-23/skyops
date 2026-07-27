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
});
