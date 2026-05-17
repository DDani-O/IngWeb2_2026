import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../../src/app.module';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  const testEmail = `test.users.${Date.now()}@example.com`;
  const testPassword = 'password123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Register and login to get a token
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        fullName: 'Users Test User',
        role: 'cliente',
      });

    accessToken = registerRes.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/users/me (GET)', () => {
    it('should return current user profile', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('email', testEmail);
          expect(res.body).toHaveProperty('fullName', 'Users Test User');
        });
    });

    it('should throw 401 Unauthorized when no token is provided', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .expect(401);
    });
  });

  describe('/users/me (PATCH)', () => {
    it('should update current user profile', () => {
      return request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          fullName: 'Updated Name',
          occupation: 'Lead Engineer',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('fullName', 'Updated Name');
        });
    });
  });

  describe('/users/me/recommendations (GET)', () => {
    it('should return recommendations for the user', () => {
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
});
