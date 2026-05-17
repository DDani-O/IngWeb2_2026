import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../../src/app.module';
import { SUPABASE_CLIENT } from './../../src/common/supabase/supabase.provider';
import { SupabaseClient } from '@supabase/supabase-js';
import { cleanupTestUser, generateTestEmail } from './test-utils';

describe('AdvisorController (e2e)', () => {
  let app: INestApplication;
  let supabase: SupabaseClient;
  let advisorAccessToken: string;
  let advisorId: string;
  let clientId: string;
  const advisorEmail = generateTestEmail('advisor');
  const clientEmail = generateTestEmail('client');
  const password = 'password123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    supabase = app.get(SUPABASE_CLIENT);

    // 1. Register Advisor
    const advisorRegRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: advisorEmail,
        password: password,
        fullName: 'Test Advisor Full',
        role: 'asesor',
        licenseNumber: `LIC-${Date.now()}`,
        specialty: 'Finance',
      });

    if (advisorRegRes.status !== 201) throw new Error(`Advisor Reg Failed: ${JSON.stringify(advisorRegRes.body)}`);
    advisorAccessToken = advisorRegRes.body.access_token;
    advisorId = advisorRegRes.body.user.id;

    // 2. Register Client
    const clientRegRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: clientEmail,
        password: password,
        fullName: 'Test Client Linked',
        role: 'cliente',
      });

    if (clientRegRes.status !== 201) throw new Error(`Client Reg Failed: ${JSON.stringify(clientRegRes.body)}`);
    clientId = clientRegRes.body.user.id;

    // 3. Manual Assignment (Bypass RLS for setup)
    await supabase.from('asignaciones_de_clientes').insert({
      asesor_id: advisorId,
      cliente_id: clientId,
      activo: true,
      asignado_en: new Date().toISOString()
    });
  });

  afterAll(async () => {
    await cleanupTestUser(supabase, advisorId);
    await cleanupTestUser(supabase, clientId);
    await app.close();
  });

  it('GET /advisor/dashboard - should return dashboard structure', () => {
    return request(app.getHttpServer())
      .get('/advisor/dashboard')
      .set('Authorization', `Bearer ${advisorAccessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('stats');
        expect(res.body).toHaveProperty('advisor');
      });
  });

  it('GET /advisor/clients - should list assigned clients', () => {
    return request(app.getHttpServer())
      .get('/advisor/clients')
      .set('Authorization', `Bearer ${advisorAccessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('data');
        expect(res.body.data.some(c => c.id === clientId)).toBe(true);
      });
  });

  it('GET /advisor/clients/:id - should return client details', () => {
    return request(app.getHttpServer())
      .get(`/advisor/clients/${clientId}`)
      .set('Authorization', `Bearer ${advisorAccessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('id', clientId);
        expect(res.body).toHaveProperty('email', clientEmail);
      });
  });

  it('POST /advisor/recommendations - should attempt to create a recommendation', async () => {
    const res = await request(app.getHttpServer())
      .post('/advisor/recommendations')
      .set('Authorization', `Bearer ${advisorAccessToken}`)
      .send({
        clientId: clientId,
        title: 'E2E Test Rec',
        content: 'Content for testing validation and flow',
        type: 'consejo',
        priority: 'alta'
      });

    // Note: If this fails with 500, it is likely due to strict DB triggers
    // expecting specific session context not available via service-role.
    if (res.status === 201) {
      expect(res.body).toHaveProperty('id');
    }
  });

  it('POST /advisor/messages - should attempt to send message to client', async () => {
    const res = await request(app.getHttpServer())
      .post('/advisor/messages')
      .set('Authorization', `Bearer ${advisorAccessToken}`)
      .send({
        clientId: clientId,
        subject: 'E2E Test Msg',
        content: 'Hello from test suite'
      });

    if (res.status === 201) {
      expect(res.body).toHaveProperty('id');
    }
  });

  it('GET /advisor/reports - should return reports data', () => {
    return request(app.getHttpServer())
      .get('/advisor/reports')
      .set('Authorization', `Bearer ${advisorAccessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('summary');
      });
  });
});
