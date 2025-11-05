export class CrearTratamientoDto {
  nombre!: string;
  variableIndependiente!: string;
  factor!: string;
  nivel!: string;
  id_proyecto?: number;
  numeroRepeticiones!: number;           // nueva propiedad
  numeroMuestrasPorRepeticion!: number; // nueva propiedad
}
