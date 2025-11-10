// src/modules/alertas/alertas.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertasController } from './alertas.controller';
import { AlertasService } from './alertas.service';
import { Alerta } from '../../entities/alerta.entity';
import { Proyecto } from '../../entities/proyecto.entity'; // ✅ AGREGAR
import { AuthModule } from '../../auth/auth.module';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Alerta, Proyecto]), // ✅ AGREGAR Proyecto aquí
    AuthModule,
    UsuariosModule,
    // ✅ QUITAR ProyectosModule de los imports
  ],
  controllers: [AlertasController],
  providers: [AlertasService],
  exports: [AlertasService],
})
export class AlertasModule {}