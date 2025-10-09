import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VariablesDependientesService } from './variables-dependientes.service';
import { VariablesDependientesController } from './variables-dependientes.controller';
import { VariableDependiente } from '../../entities/variable-dependiente.entity';
import { ProyectosModule } from '../proyectos/proyectos.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VariableDependiente]),
    forwardRef(() => ProyectosModule),
    AuthModule,
  ],
  controllers: [VariablesDependientesController],
  providers: [VariablesDependientesService],
  exports: [VariablesDependientesService],
})
export class VariablesDependientesModule {}
