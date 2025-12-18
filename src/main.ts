import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv'

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    credentials: true,
  });

  const PORT = process.env.PORT || 3000;
  const HOST = process.env.HOTS || '0.0.0.0';


  await app.listen(PORT, HOST);
}
bootstrap();
