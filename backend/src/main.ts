/** Punto de entrada del servidor: aplica `configureApp`, habilita CORS y escucha en `PORT`. */
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { configureApp } from "./app.setup";

/**
 * CORS solo para el front publicado (`FRONTEND_URL`) y el de desarrollo: la API usa
 * token en el header `Authorization`, no cookies, así que no hace falta `credentials`.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  app.enableCors({
    origin: [process.env.FRONTEND_URL, "http://localhost:5500"].filter(
      Boolean,
    ) as string[],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
}

bootstrap();
