export class CrearProyectoDto {
  nombre!: string;
  descripcion!: string;
  id_investigador_principal!: number;
  tipo_disenio!: string;
}

export class ActualizarProyectoDto {
  nombre?: string;
  descripcion?: string;
  id_investigador_principal?: number;
  tipo_disenio?: string;
}