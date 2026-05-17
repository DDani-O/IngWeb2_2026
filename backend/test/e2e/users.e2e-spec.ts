import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../../src/app.module';
import { SUPABASE_CLIENT } from './../../src/common/supabase/supabase.provider';
import { SupabaseClient } from '@supabase/supabase-js';
import { cleanupTestUser, generateTestEmail } from './test-utils';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let supabase: SupabaseClient;
  let accessToken: string;
  let userId: string;
  const testEmail = generateTestEmail('users.full');
  const testPassword = 'password123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    supabase = app.get(SUPABASE_CLIENT);

    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        fullName: 'Users Full Test',
        role: 'cliente',
        occupation: 'Software Engineer'
      });

    accessToken = registerRes.body.access_token;
    userId = registerRes.body.user.id;
  });

  afterAll(async () => {
    await cleanupTestUser(supabase, userId);
    await app.close();
  });

  it('GET /users/me - should return complete profile', () => {
    return request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('email', testEmail);
        expect(res.body).toHaveProperty('fullName', 'Users Full Test');
        expect(res.body).toHaveProperty('role', 'cliente');
      });
  });

  it('PATCH /users/me - should update profile info', () => {
    return request(app.getHttpServer())
      .patch('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        fullName: 'Updated User Name',
        occupation: 'Senior Developer'
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('fullName', 'Updated User Name');
      });
  });

  it('GET /users/me/recommendations - should return user specific recommendations', () => {
    return request(app.getHttpServer())
      .get('/users/me/recommendations')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('stats');
        expect(res.body).toHaveProperty('recommendations');
        expect(Array.isArray(res.body.recommendations)).toBe(true);
      });
  });
});
