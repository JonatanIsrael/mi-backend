import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://localhost:5173', // tu frontend
    credentials: true,               // si quieres enviar cookies o JWT
  });
  await app.listen(3000);
}
bootstrap();
