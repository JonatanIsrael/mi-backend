import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertasController } from './alertas.controller';
import { AlertasService } from './alertas.service';
import { Alerta } from '../../entities/alerta.entity';
import { Proyecto } from '../../entities/proyecto.entity';
import { AuthModule } from '../../auth/auth.module'; // <-- Agregar si AlertasController usa JwtAuthGuard
import { ProyectosModule } from '../proyectos/proyectos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Alerta, Proyecto]),
    AuthModule,          // <-- necesario si se usa JwtAuthGuard
    ProyectosModule,
  ],
  controllers: [AlertasController],
  providers: [AlertasService],
  exports: [AlertasService],
})
export class AlertasModule {}
