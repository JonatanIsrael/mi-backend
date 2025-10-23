export class CrearTratamientoDto {
  nombre!: string;
  descripcion?: string;
  esTestigo?: boolean;
  variableIndependiente!: string;
  valor!: number;
  unidad!: string;
  id_proyecto?: number; // opcional si creas tratamiento independiente
}

