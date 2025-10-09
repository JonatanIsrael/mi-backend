import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LecturasController } from './lecturas.controller';
import { LecturasService } from './lecturas.service';
import { Lectura } from '../../entities/lectura.entity';
import { Muestra } from '../../entities/muestra.entity';
import { VariableDependiente } from '../../entities/variable-dependiente.entity';
import { MuestrasModule } from '../muestras/muestras.module';
import { VariablesDependientesModule } from '../variables-dependientes/variables-dependientes.module';
import { AuthModule } from '../../auth/auth.module'; // <-- Agregar si se usa JwtAuthGuard

@Module({
  imports: [
    TypeOrmModule.forFeature([Lectura, Muestra, VariableDependiente]),
    MuestrasModule,
    VariablesDependientesModule,
    AuthModule,
  ],
  controllers: [LecturasController],
  providers: [LecturasService],
  exports: [LecturasService],
})
export class LecturasModule {}
