export class CrearVariableDto {
  nombreCompleto!: string;
  clave!: string;
  unidad!: string;
  id_proyecto?: number; // opcional si se crea variable independiente
}
