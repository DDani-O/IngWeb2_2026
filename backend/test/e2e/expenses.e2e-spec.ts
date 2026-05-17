import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../../src/app.module';

describe('ExpensesController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let categoryId: string;
  let expenseId: string;
  const testEmail = `test.expenses.${Date.now()}@example.com`;
  const testPassword = 'password123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Register to get a token
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        fullName: 'Expenses Test User',
        role: 'cliente',
      });

    accessToken = registerRes.body.access_token;

    // Get a valid categoryId
    const categoriesRes = await request(app.getHttpServer())
      .get('/categories')
      .expect(200);

    categoryId = categoriesRes.body[0].id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/expenses (POST)', () => {
    it('should create a new expense', () => {
      return request(app.getHttpServer())
        .post('/expenses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          amount: 100.50,
          merchant: 'Supermarket',
          categoryId: categoryId,
          date: new Date().toISOString(),
          notes: 'Weekly groceries',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('amount', 100.5);
          expenseId = res.body.id;
        });
    });
  });

  describe('/expenses (GET)', () => {
    it('should return list of expenses', () => {
      return request(app.getHttpServer())
        .get('/expenses')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThan(0);
        });
    });
  });

  describe('/expenses/summary (GET)', () => {
    it('should return expense summary', () => {
      const month = new Date().toISOString().substring(0, 7); // YYYY-MM
      return request(app.getHttpServer())
        .get(`/expenses/summary?month=${month}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalMonth');
          expect(res.body).toHaveProperty('totalByCategory');
        });
    });
  });

  describe('/expenses/:id (GET)', () => {
    it('should return a single expense', () => {
      return request(app.getHttpServer())
        .get(`/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', expenseId);
        });
    });
  });

  describe('/expenses/:id (PATCH)', () => {
    it('should update an expense', () => {
      return request(app.getHttpServer())
        .patch(`/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          amount: 150.00,
          merchant: 'Supermarket Updated',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('amount', 150);
          expect(res.body).toHaveProperty('merchant', 'Supermarket Updated');
        });
    });
  });

  describe('/expenses/:id (DELETE)', () => {
    it('should delete an expense', () => {
      return request(app.getHttpServer())
        .delete(`/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });
  });
});
