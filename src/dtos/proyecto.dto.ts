import { TipoDisenio } from '../entities/proyecto.entity';
import { CrearTratamientoDto } from './tratamiento.dto';
import { CrearVariableDto } from './variable-dependiente.dto';

export class CrearProyectoDto {
  nombre!: string;
  descripcion?: string;
  id_investigador_principal!: number;
  tipo_disenio!: string;
}

export class ActualizarProyectoDto {
  nombre?: string;
  descripcion?: string;
  id_investigador_principal?: number;
  tipo_disenio?: string;
}

export class CrearProyectoCompletoDto extends CrearProyectoDto {
  userId!: number;
  tratamientos!: CrearTratamientoDto[];
  variablesDependientes!: CrearVariableDto[];
  numRepeticiones!: number;
  numMuestras?: number; // opcional
}
