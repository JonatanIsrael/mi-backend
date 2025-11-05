import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv'

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true, // tu frontend
    credentials: true,               // si quieres enviar cookies o JWT
  });

  const PORT = process.env.PORT || 3000;
  const HOST = process.env.HOTS || '0.0.0.0';


  await app.listen(PORT, HOST);
  console.log(`Servidor corriendo en http://${HOST}:${PORT}`);
}
bootstrap();
