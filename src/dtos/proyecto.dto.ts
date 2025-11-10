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

export class CrearProyectoCompletoDto {
  userId!: number;
  nombre!: string;
  descripcion?: string;
  tipoDisenio!: string;
  variablesDependientes!: CrearVariableDto[];
  tratamientos!: CrearTratamientoDto[];
  numRepeticiones!: number;
  numMuestras!: number;
  fechaInicio!: string;
  fechaFin!: string;
  frecuenciaDias?: number;
  fechasObservacion!: string[];
  lecturas!: any[];
}
