import { RolEquipo } from "entities/equipo.entity";
export class CrearEquipoDto {
  id_proyecto!: number;
  id_miembros!: number[];
  rolEnEquipo!: RolEquipo;
}
