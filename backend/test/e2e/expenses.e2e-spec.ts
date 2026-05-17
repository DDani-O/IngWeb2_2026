import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../../src/app.module';
import { SUPABASE_CLIENT } from './../../src/common/supabase/supabase.provider';
import { SupabaseClient } from '@supabase/supabase-js';
import { cleanupTestUser, generateTestEmail } from './test-utils';

/**
 * Pruebas de Integración (E2E) para el Módulo de Gastos (Expenses).
 * Cubre el flujo de vida completo de un gasto: Creación, Lectura, Resumen, Actualización y Eliminación.
 */
describe('ExpensesController (e2e)', () => {
  let app: INestApplication;
  let supabase: SupabaseClient;
  let accessToken: string;
  let userId: string;
  let categoryId: string;
  let testExpenseId: string;
  const testEmail = generateTestEmail('expenses.full');
  const testPassword = 'password123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    supabase = app.get(SUPABASE_CLIENT);

    // Registro de un usuario cliente para realizar las operaciones de gastos
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        fullName: 'Expenses Full Test',
        role: 'cliente',
      });

    accessToken = registerRes.body.access_token;
    userId = registerRes.body.user.id;

    // Obtenemos una categoría válida para asignar al gasto de prueba
    const categoriesRes = await request(app.getHttpServer()).get('/categories');
    categoryId = categoriesRes.body[0].id;
  });

  afterAll(async () => {
    // Limpieza de datos al finalizar las pruebas
    await cleanupTestUser(supabase, userId);
    await app.close();
  });

  describe('CRUD Flow', () => {
    /**
     * Caso de prueba: Crear un nuevo gasto.
     * Valida que el endpoint acepte los datos del DTO y persista el gasto correctamente.
     */
    it('POST /expenses - should create a new expense', async () => {
      const res = await request(app.getHttpServer())
        .post('/expenses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          amount: 125.50,
          merchant: 'Test Restaurant',
          categoryId: categoryId,
          date: new Date().toISOString(),
          notes: 'Dinner with friends'
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('amount', 125.5);
      testExpenseId = res.body.id;
    });

    /**
     * Caso de prueba: Listar los gastos del usuario.
     * Verifica que el listado sea un arreglo paginado y contenga el gasto creado.
     */
    it('GET /expenses - should return list of expenses', () => {
      return request(app.getHttpServer())
        .get('/expenses')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThan(0);
        });
    });

    /**
     * Caso de prueba: Obtener resumen financiero mensual.
     * Verifica los cálculos agregados de gastos para el mes actual.
     */
    it('GET /expenses/summary - should return monthly summary', () => {
      const month = new Date().toISOString().substring(0, 7);
      return request(app.getHttpServer())
        .get(`/expenses/summary?month=${month}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('totalMonth');
          expect(res.body.totalMonth).toBeGreaterThanOrEqual(125.5);
        });
    });

    /**
     * Caso de prueba: Actualizar un gasto existente.
     * Valida que el método PATCH permita modificar atributos específicos del gasto.
     */
    it('PATCH /expenses/:id - should update expense amount', () => {
      return request(app.getHttpServer())
        .patch(`/expenses/${testExpenseId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ amount: 150.00 })
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('amount', 150);
        });
    });

    /**
     * Caso de prueba: Eliminar un gasto.
     * Verifica que el registro se elimine correctamente y retorne un 204 No Content.
     */
    it('DELETE /expenses/:id - should remove the expense', () => {
      return request(app.getHttpServer())
        .delete(`/expenses/${testExpenseId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });
  });
});
