import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../../src/app.module';

/**
 * Pruebas de Integración (E2E) para el Módulo de Categorías.
 * Verifica la disponibilidad de los datos maestros del sistema.
 */
describe('CategoriesController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * Caso de prueba: Listar categorías globales.
   * Verifica que el endpoint retorne un arreglo de categorías con sus propiedades básicas.
   * Este endpoint es público.
   */
  it('/categories (GET)', () => {
    return request(app.getHttpServer())
      .get('/categories')
      .expect(200)
      .expect((res: any) => {
        expect(Array.isArray(res.body)).toBe(true);
        if (res.body.length > 0) {
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('nombre');
        }
      });
  });
});
