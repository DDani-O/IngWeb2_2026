import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  const testEmail = `test.user.${Date.now()}@example.com`;
  const testPassword = 'password123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new client user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          fullName: 'Test User',
          role: 'cliente',
          occupation: 'Engineer',
          estimatedIncome: 50000,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body.user).toHaveProperty('email', testEmail);
          expect(res.body.user).toHaveProperty('role', 'cliente');
        });
    });

    it('should throw 409 Conflict when registering with existing email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          fullName: 'Test User 2',
          role: 'cliente',
        })
        .expect(409);
    });

    it('should throw 400 Bad Request when validation fails', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: '123', // too short
          fullName: '',
          role: 'invalid-role',
        })
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login successfully with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body.user).toHaveProperty('email', testEmail);
        });
    });

    it('should throw 401 Unauthorized with invalid password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should throw 401 Unauthorized with non-existent user', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'any-password',
        })
        .expect(401);
    });
  });
});
