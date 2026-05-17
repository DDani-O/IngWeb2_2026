import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../../src/app.module';
import { SUPABASE_CLIENT } from './../../src/common/supabase/supabase.provider';
import { SupabaseClient } from '@supabase/supabase-js';
import { cleanupTestUser, generateTestEmail } from './test-utils';

/**
 * Pruebas de Integración (E2E) para el Módulo de Autenticación.
 * Cubre los procesos de registro, login y validación de restricciones.
 */
describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let supabase: SupabaseClient;
  const testEmail = generateTestEmail('auth.user');
  const testPassword = 'password123';
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Importante: El ValidationPipe es necesario para que las validaciones de los DTOs funcionen en los tests
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    supabase = app.get(SUPABASE_CLIENT);
  });

  afterAll(async () => {
    // Elimina el usuario creado durante los tests para mantener la BD limpia
    await cleanupTestUser(supabase, userId);
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    /**
     * Caso de prueba: Registro exitoso de un nuevo cliente.
     * Verifica que se cree el usuario, se devuelva un token y los datos del perfil sean correctos.
     */
    it('should register a new client user', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          fullName: 'Test User',
          role: 'cliente',
          occupation: 'Engineer',
          estimatedIncome: 50000,
        })
        .expect(201);

      expect(res.body).toHaveProperty('access_token');
      expect(res.body.user).toHaveProperty('email', testEmail);
      userId = res.body.user.id;
    });

    /**
     * Caso de prueba: Conflicto por email duplicado.
     * Intenta registrar un usuario con el mismo email que el anterior y espera un error 409.
     */
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
  });

  describe('/auth/login (POST)', () => {
    /**
     * Caso de prueba: Login exitoso.
     * Verifica que el usuario registrado anteriormente pueda iniciar sesión con sus credenciales.
     */
    it('should login successfully with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body.user).toHaveProperty('email', testEmail);
        });
    });
  });
});
